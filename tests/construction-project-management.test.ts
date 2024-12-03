import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let projects: { [key: number]: any } = {}
let milestoneCompletions: { [key: string]: any } = {}
let lastProjectId = 0

// Mock contract functions
const createProject = (sender: string, title: string, description: string, contractor: string, totalBudget: number, milestones: number[]) => {
  if (sender !== 'contract-owner') {
    return { success: false, error: 100 }
  }
  lastProjectId++
  projects[lastProjectId] = {
    title,
    description,
    contractor,
    total_budget: totalBudget,
    remaining_budget: totalBudget,
    milestones,
    current_milestone: 0,
    status: 'active'
  }
  return { success: true, value: lastProjectId }
}

const completeMilestone = (sender: string, projectId: number, milestone: number) => {
  if (!projects[projectId]) {
    return { success: false, error: 101 }
  }
  if (sender !== projects[projectId].contractor) {
    return { success: false, error: 102 }
  }
  if (milestone >= projects[projectId].milestones.length) {
    return { success: false, error: 101 }
  }
  milestoneCompletions[`${projectId}:${milestone}`] = { completed: true, approved: false }
  return { success: true }
}

const approveMilestone = (sender: string, projectId: number, milestone: number) => {
  if (sender !== 'contract-owner') {
    return { success: false, error: 100 }
  }
  if (!projects[projectId]) {
    return { success: false, error: 101 }
  }
  if (!milestoneCompletions[`${projectId}:${milestone}`] || !milestoneCompletions[`${projectId}:${milestone}`].completed) {
    return { success: false, error: 101 }
  }
  milestoneCompletions[`${projectId}:${milestone}`].approved = true
  if (milestone === projects[projectId].milestones.length - 1) {
    projects[projectId].status = 'completed'
  } else {
    projects[projectId].current_milestone = milestone + 1
  }
  return { success: true }
}

const releasePayment = (sender: string, projectId: number) => {
  if (sender !== 'contract-owner') {
    return { success: false, error: 100 }
  }
  if (!projects[projectId]) {
    return { success: false, error: 101 }
  }
  const currentMilestone = projects[projectId].current_milestone
  if (!milestoneCompletions[`${projectId}:${currentMilestone}`] || !milestoneCompletions[`${projectId}:${currentMilestone}`].approved) {
    return { success: false, error: 102 }
  }
  const milestoneAmount = projects[projectId].milestones[currentMilestone]
  if (projects[projectId].remaining_budget < milestoneAmount) {
    return { success: false, error: 103 }
  }
  projects[projectId].remaining_budget -= milestoneAmount
  return { success: true }
}

describe('Construction Project Management', () => {
  beforeEach(() => {
    projects = {}
    milestoneCompletions = {}
    lastProjectId = 0
  })
  
  it('allows creating a project', () => {
    const result = createProject('contract-owner', 'New Bridge', 'Construct a new bridge', 'contractor1', 1000000, [250000, 500000, 250000])
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    expect(projects[1].title).toBe('New Bridge')
    expect(projects[1].total_budget).toBe(1000000)
  })
  
  it('allows completing a milestone', () => {
    createProject('contract-owner', 'New Bridge', 'Construct a new bridge', 'contractor1', 1000000, [250000, 500000, 250000])
    const result = completeMilestone('contractor1', 1, 0)
    expect(result.success).toBe(true)
    expect(milestoneCompletions['1:0'].completed).toBe(true)
  })
  
  it('allows approving a milestone', () => {
    createProject('contract-owner', 'New Bridge', 'Construct a new bridge', 'contractor1', 1000000, [250000, 500000, 250000])
    completeMilestone('contractor1', 1, 0)
    const result = approveMilestone('contract-owner', 1, 0)
    expect(result.success).toBe(true)
    expect(milestoneCompletions['1:0'].approved).toBe(true)
    expect(projects[1].current_milestone).toBe(1)
  })
  
  it('prevents unauthorized actions', () => {
    createProject('contract-owner', 'New Bridge', 'Construct a new bridge', 'contractor1', 1000000, [250000, 500000, 250000])
    
    const result1 = completeMilestone('contractor2', 1, 0)
    expect(result1.success).toBe(false)
    expect(result1.error).toBe(102)
    
    const result2 = approveMilestone('contractor1', 1, 0)
    expect(result2.success).toBe(false)
    expect(result2.error).toBe(100)
    
    const result3 = releasePayment('contractor1', 1)
    expect(result3.success).toBe(false)
    expect(result3.error).toBe(100)
  })
})

