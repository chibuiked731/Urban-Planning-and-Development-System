import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let fundProposals: { [key: number]: any } = {}
let votes: { [key: string]: number } = {}
let lastProposalId = 0
let totalFunds = 0
let communityTokenBalances: { [key: string]: number } = {}

// Mock contract functions
const createFundProposal = (sender: string, title: string, description: string, amount: number) => {
  lastProposalId++
  fundProposals[lastProposalId] = {
    title,
    description,
    proposer: sender,
    amount,
    votes: 0,
    status: 'active'
  }
  return { success: true, value: lastProposalId }
}

const voteOnFundProposal = (sender: string, proposalId: number, amount: number) => {
  if (!fundProposals[proposalId]) {
    return { success: false, error: 101 }
  }
  if (fundProposals[proposalId].status !== 'active') {
    return { success: false, error: 101 }
  }
  if (votes[`${proposalId}:${sender}`]) {
    return { success: false, error: 103 }
  }
  if ((communityTokenBalances[sender] || 0) < amount) {
    return { success: false, error: 102 }
  }
  
  communityTokenBalances[sender] -= amount
  votes[`${proposalId}:${sender}`] = amount
  fundProposals[proposalId].votes += amount
  return { success: true }
}

const finalizeFundProposal = (sender: string, proposalId: number) => {
  if (sender !== 'contract-owner') {
    return { success: false, error: 100 }
  }
  if (!fundProposals[proposalId]) {
    return { success: false, error: 101 }
  }
  if (fundProposals[proposalId].status !== 'active') {
    return { success: false, error: 101 }
  }
  
  if (fundProposals[proposalId].votes >= fundProposals[proposalId].amount) {
    fundProposals[proposalId].status = 'approved'
    totalFunds += fundProposals[proposalId].votes
    return { success: true, value: true }
  } else {
    fundProposals[proposalId].status = 'rejected'
    return { success: true, value: false }
  }
}

const withdrawFunds = (sender: string, amount: number) => {
  if (sender !== 'contract-owner') {
    return { success: false, error: 100 }
  }
  if (amount > totalFunds) {
    return { success: false, error: 102 }
  }
  
  totalFunds -= amount
  return { success: true }
}

describe('Community Improvement Fund', () => {
  beforeEach(() => {
    fundProposals = {}
    votes = {}
    lastProposalId = 0
    totalFunds = 0
    communityTokenBalances = {
      'user1': 1000,
      'user2': 1000,
      'user3': 1000
    }
  })
  
  it('allows creating a fund proposal', () => {
    const result = createFundProposal('user1', 'New Community Center', 'Build a new community center', 5000)
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    expect(fundProposals[1].title).toBe('New Community Center')
    expect(fundProposals[1].amount).toBe(5000)
    expect(fundProposals[1].status).toBe('active')
  })
  
  it('allows voting on a fund proposal', () => {
    createFundProposal('user1', 'New Community Center', 'Build a new community center', 5000)
    const result = voteOnFundProposal('user2', 1, 500)
    expect(result.success).toBe(true)
    expect(fundProposals[1].votes).toBe(500)
    expect(communityTokenBalances['user2']).toBe(500)
  })
  
  it('prevents voting more than once', () => {
    createFundProposal('user1', 'New Community Center', 'Build a new community center', 5000)
    voteOnFundProposal('user2', 1, 500)
    const result = voteOnFundProposal('user2', 1, 200)
    expect(result.success).toBe(false)
    expect(result.error).toBe(103)
  })
  
  it('prevents voting with insufficient funds', () => {
    createFundProposal('user1', 'New Community Center', 'Build a new community center', 5000)
    const result = voteOnFundProposal('user2', 1, 1500)
    expect(result.success).toBe(false)
    expect(result.error).toBe(102)
  })
  
  it('allows finalizing a rejected fund proposal', () => {
    createFundProposal('user1', 'New Community Center', 'Build a new community center', 5000)
    voteOnFundProposal('user2', 1, 2000)
    voteOnFundProposal('user3', 1, 1000)
    const result = finalizeFundProposal('contract-owner', 1)
    expect(result.success).toBe(true)
    expect(result.value).toBe(false)
    expect(fundProposals[1].status).toBe('rejected')
    expect(totalFunds).toBe(0)
  })
  
  it('prevents non-owner from finalizing a proposal', () => {
    createFundProposal('user1', 'New Community Center', 'Build a new community center', 5000)
    const result = finalizeFundProposal('user2', 1)
    expect(result.success).toBe(false)
    expect(result.error).toBe(100)
  })
})

