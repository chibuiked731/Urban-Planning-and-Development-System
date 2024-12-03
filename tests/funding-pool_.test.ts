import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let funders: { [key: string]: number } = {}
let totalFunds = 0

// Mock contract functions
const fund = (sender: string, amount: number) => {
  funders[sender] = (funders[sender] || 0) + amount
  totalFunds += amount
  return { success: true }
}

const withdraw = (sender: string, amount: number, recipient: string) => {
  if (sender !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
    return { success: false, error: 401 }
  }
  if (amount > totalFunds) {
    return { success: false, error: 402 }
  }
  totalFunds -= amount
  return { success: true }
}

describe('FundingPool', () => {
  beforeEach(() => {
    funders = {}
    totalFunds = 0
  })
  
  it('ensures funds can be added and withdrawn', () => {
    const deployer = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    const fundResult = fund(wallet1, 1000)
    expect(fundResult.success).toBe(true)
    expect(totalFunds).toBe(1000)
    
    const withdrawResult = withdraw(deployer, 500, wallet1)
    expect(withdrawResult.success).toBe(true)
    expect(totalFunds).toBe(500)
  })
})

