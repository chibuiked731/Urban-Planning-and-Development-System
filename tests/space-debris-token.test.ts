import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let tokenBalances: { [key: string]: number } = {}
let contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'

// Mock contract functions
const mint = (sender: string, amount: number, recipient: string) => {
  if (sender !== contractOwner) {
    return { success: false, error: 100 }
  }
  tokenBalances[recipient] = (tokenBalances[recipient] || 0) + amount
  return { success: true }
}

const getBalance = (account: string) => {
  return tokenBalances[account] || 0
}

describe('SpaceDebrisToken', () => {
  beforeEach(() => {
    tokenBalances = {}
  })
  
  it('ensures token can be minted by owner', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    const mintResult = mint(contractOwner, 100, wallet1)
    expect(mintResult.success).toBe(true)
    
    const balance = getBalance(wallet1)
    expect(balance).toBe(100)
  })
  
  it('ensures token cannot be minted by non-owner', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    const mintResult = mint(wallet1, 100, wallet2)
    expect(mintResult.success).toBe(false)
    expect(mintResult.error).toBe(100)
    
    const balance = getBalance(wallet2)
    expect(balance).toBe(0)
  })
})

