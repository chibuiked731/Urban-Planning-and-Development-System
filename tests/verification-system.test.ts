import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let verifiers: { [key: string]: { name: string, active: boolean } } = {}

// Mock contract functions
const addVerifier = (sender: string, verifier: string, name: string) => {
  if (sender !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
    return { success: false, error: 401 }
  }
  verifiers[verifier] = { name, active: true }
  return { success: true }
}

const removeVerifier = (sender: string, verifier: string) => {
  if (sender !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
    return { success: false, error: 401 }
  }
  delete verifiers[verifier]
  return { success: true }
}

const isVerifier = (verifier: string) => {
  return verifier in verifiers
}

describe('VerificationSystem', () => {
  beforeEach(() => {
    verifiers = {}
  })
  
  it('ensures verifiers can be added and removed', () => {
    const deployer = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    const addResult = addVerifier(deployer, wallet1, 'Space Agency 1')
    expect(addResult.success).toBe(true)
    expect(isVerifier(wallet1)).toBe(true)
    
    const removeResult = removeVerifier(deployer, wallet1)
    expect(removeResult.success).toBe(true)
    expect(isVerifier(wallet1)).toBe(false)
  })
})

