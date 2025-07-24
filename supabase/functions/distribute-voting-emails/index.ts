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
    const { voteId, memberIds, templateId } = await req.json()

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

    // Get members to send emails to
    let membersQuery = supabase
      .from('members')
      .select('*')
      .eq('building_id', vote.building_id)
      .eq('is_active', true)

    if (memberIds && memberIds.length > 0) {
      membersQuery = membersQuery.in('id', memberIds)
    }

    const { data: members, error: membersError } = await membersQuery

    if (membersError || !members) {
      throw new Error('Failed to fetch members')
    }

    // Get default template if not specified
    let templateIdToUse = templateId
    if (!templateIdToUse) {
      const { data: defaultTemplate } = await supabase
        .from('email_templates')
        .select('id')
        .eq('category', 'voting')
        .eq('is_default', true)
        .single()
      
      templateIdToUse = defaultTemplate?.id
    }

    if (!templateIdToUse) {
      throw new Error('No email template specified or found')
    }

    const results = []
    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'

    // Send email to each member
    for (const member of members) {
      try {
        // Call send-voting-email function
        const response = await fetch(`${supabaseUrl}/functions/v1/send-voting-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            voteId: voteId,
            memberId: member.id,
            templateId: templateIdToUse
          })
        })

        const result = await response.json()
        
        results.push({
          memberId: member.id,
          email: member.email,
          success: response.ok,
          error: response.ok ? null : result.error
        })

      } catch (error) {
        results.push({
          memberId: member.id,
          email: member.email,
          success: false,
          error: error.message
        })
      }
    }

    // Update voting session stats
    const successCount = results.filter(r => r.success).length
    const { error: sessionError } = await supabase
      .from('voting_sessions')
      .upsert({
        vote_id: voteId,
        total_members: members.length,
        emails_sent: successCount,
        votes_received: 0
      })

    if (sessionError) {
      console.error('Failed to update voting session:', sessionError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        totalMembers: members.length,
        emailsSent: successCount,
        results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error distributing voting emails:', error)
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