import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { voteId, memberId, templateId } = await req.json()

    // Get environment variables
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@onlinesprava.cz'
    const FROM_NAME = Deno.env.get('FROM_NAME') || 'OnlineSprava'
    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'

    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get vote data
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .select(`
        *,
        buildings (name, address)
      `)
      .eq('id', voteId)
      .single()

    if (voteError || !vote) {
      throw new Error('Vote not found')
    }

    // Get member data
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      throw new Error('Member not found')
    }

    // Generate personalized token
    const token = crypto.randomUUID() + '-' + Date.now()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Save personalized link
    const { error: linkError } = await supabase
      .from('personalized_voting_links')
      .insert({
        vote_id: voteId,
        member_id: memberId,
        token: token,
        expires_at: expiresAt.toISOString()
      })

    if (linkError) {
      throw new Error('Failed to create voting link')
    }

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      throw new Error('Email template not found')
    }

    // Prepare template variables
    const votingLink = `${FRONTEND_URL}/vote/${token}`
    const variables = {
      recipient_name: `${member.first_name} ${member.last_name}`,
      vote_title: vote.title,
      vote_description: vote.description,
      vote_start_date: new Date(vote.start_date).toLocaleDateString('cs-CZ'),
      vote_end_date: new Date(vote.end_date).toLocaleDateString('cs-CZ'),
      voting_link: votingLink,
      building_name: vote.buildings.name
    }

    // Replace variables in template
    let emailContent = template.content
    let emailSubject = template.subject
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      emailContent = emailContent.replace(regex, value)
      emailSubject = emailSubject.replace(regex, value)
    })

    // Send email via Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: FROM_NAME,
          email: FROM_EMAIL
        },
        to: [{
          email: member.email,
          name: `${member.first_name} ${member.last_name}`
        }],
        subject: emailSubject,
        htmlContent: emailContent
      })
    })

    const brevoResult = await brevoResponse.json()

    // Log email delivery
    const deliveryStatus = brevoResponse.ok ? 'sent' : 'failed'
    const { error: logError } = await supabase
      .from('email_delivery_logs')
      .insert({
        vote_id: voteId,
        member_id: memberId,
        template_id: templateId,
        recipient_email: member.email,
        subject: emailSubject,
        status: deliveryStatus,
        error_message: brevoResponse.ok ? null : JSON.stringify(brevoResult),
        sent_at: brevoResponse.ok ? new Date().toISOString() : null
      })

    if (logError) {
      console.error('Failed to log email delivery:', logError)
    }

    if (!brevoResponse.ok) {
      throw new Error(`Brevo API error: ${JSON.stringify(brevoResult)}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: brevoResult.messageId,
        votingLink: votingLink
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending voting email:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})