import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let proposals: { [key: number]: any } = {}
let votes: { [key: string]: boolean } = {}
let lastProposalId = 0
let votingTokenBalances: { [key: string]: number } = {}

// Mock contract functions
const createProposal = (sender: string, title: string, description: string, arModelHash?: string) => {
  lastProposalId++
  proposals[lastProposalId] = {
    title,
    description,
    proposer: sender,
    votes_for: 0,
    votes_against: 0,
    status: 'active',
    ar_model_hash: arModelHash || null
  }
  return { success: true, value: lastProposalId }
}

const vote = (sender: string, proposalId: number, voteFor: boolean) => {
  if (!proposals[proposalId]) {
    return { success: false, error: 101 }
  }
  if (proposals[proposalId].status !== 'active') {
    return { success: false, error: 101 }
  }
  if (votes[`${proposalId}:${sender}`] !== undefined) {
    return { success: false, error: 102 }
  }
  if ((votingTokenBalances[sender] || 0) < 1) {
    return { success: false, error: 103 }
  }
  
  votingTokenBalances[sender]--
  votes[`${proposalId}:${sender}`] = voteFor
  if (voteFor) {
    proposals[proposalId].votes_for++
  } else {
    proposals[proposalId].votes_against++
  }
  return { success: true }
}

const closeProposal = (sender: string, proposalId: number) => {
  if (sender !== 'contract-owner') {
    return { success: false, error: 100 }
  }
  if (!proposals[proposalId]) {
    return { success: false, error: 101 }
  }
  if (proposals[proposalId].status !== 'active') {
    return { success: false, error: 101 }
  }
  
  proposals[proposalId].status = proposals[proposalId].votes_for > proposals[proposalId].votes_against ? 'approved' : 'rejected'
  return { success: true }
}

describe('Urban Development Proposal', () => {
  beforeEach(() => {
    proposals = {}
    votes = {}
    lastProposalId = 0
    votingTokenBalances = {
      'user1': 10,
      'user2': 10,
      'user3': 10
    }
  })
  
  it('allows creating a proposal', () => {
    const result = createProposal('user1', 'New Park', 'Create a new park in the city center')
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    expect(proposals[1].title).toBe('New Park')
    expect(proposals[1].status).toBe('active')
  })
  
  it('allows voting on a proposal', () => {
    createProposal('user1', 'New Park', 'Create a new park in the city center')
    const result = vote('user2', 1, true)
    expect(result.success).toBe(true)
    expect(proposals[1].votes_for).toBe(1)
    expect(votingTokenBalances['user2']).toBe(9)
  })
  
  it('prevents double voting', () => {
    createProposal('user1', 'New Park', 'Create a new park in the city center')
    vote('user2', 1, true)
    const result = vote('user2', 1, false)
    expect(result.success).toBe(false)
    expect(result.error).toBe(102)
  })
  
  it('prevents unauthorized closing of a proposal', () => {
    createProposal('user1', 'New Park', 'Create a new park in the city center')
    const result = closeProposal('user2', 1)
    expect(result.success).toBe(false)
    expect(result.error).toBe(100)
  })
})

