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
    const { token, answers } = await req.json()

    if (!token || !answers || !Array.isArray(answers)) {
      throw new Error('Token and answers are required')
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
        votes (*),
        members (*)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (linkError || !votingLink) {
      throw new Error('Invalid or expired voting link')
    }

    // Check if link has expired
    if (new Date(votingLink.expires_at) < new Date()) {
      throw new Error('Voting link has expired')
    }

    // Check if vote is active
    if (votingLink.votes.status !== 'active') {
      throw new Error('Voting is not currently active')
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('user_votes')
      .select('id')
      .eq('vote_id', votingLink.vote_id)
      .eq('member_id', votingLink.member_id)
      .limit(1)

    if (existingVote && existingVote.length > 0) {
      throw new Error('You have already voted')
    }

    // Prepare vote data
    const userVoteData = answers.map((answer: any) => ({
      vote_id: votingLink.vote_id,
      member_id: votingLink.member_id,
      question_id: answer.questionId,
      option_ids: answer.optionIds
    }))

    // Insert votes
    const { error: voteError } = await supabase
      .from('user_votes')
      .insert(userVoteData)

    if (voteError) {
      throw new Error('Failed to record vote')
    }

    // Mark voting link as used
    const { error: linkUpdateError } = await supabase
      .from('personalized_voting_links')
      .update({
        is_active: false,
        used_at: new Date().toISOString()
      })
      .eq('id', votingLink.id)

    if (linkUpdateError) {
      console.error('Failed to update voting link:', linkUpdateError)
    }

    // Update voting session stats
    const { error: sessionError } = await supabase.rpc('increment_votes_received', {
      vote_id: votingLink.vote_id
    })

    if (sessionError) {
      console.error('Failed to update voting session:', sessionError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Vote recorded successfully',
        member: votingLink.members,
        vote: votingLink.votes
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error processing email vote:', error)
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