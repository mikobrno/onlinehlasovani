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
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      throw new Error('Token is required')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get voting link data
    const { data: votingLink, error: linkError } = await supabase
      .from('personalized_voting_links')
      .select(`
        *,
        votes (*,
          buildings (name, address)
        ),
        members (*)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (linkError || !votingLink) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or expired voting link' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Check if link has expired
    if (new Date(votingLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          error: 'Voting link has expired' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 410 
        }
      )
    }

    // Check if vote is active
    if (votingLink.votes.status !== 'active') {
      return new Response(
        JSON.stringify({ 
          error: 'Voting is not currently active' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('user_votes')
      .select('id')
      .eq('vote_id', votingLink.vote_id)
      .eq('member_id', votingLink.member_id)
      .limit(1)

    const hasVoted = existingVote && existingVote.length > 0

    return new Response(
      JSON.stringify({
        success: true,
        vote: votingLink.votes,
        member: votingLink.members,
        building: votingLink.votes.buildings,
        hasVoted: hasVoted,
        linkId: votingLink.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error getting voting data:', error)
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