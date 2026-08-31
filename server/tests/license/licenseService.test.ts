import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockQuery = vi.fn()

vi.mock('~/server/services/database', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}))

import {
  generateLicenseKey,
  createLicense,
  activateLicense,
  verifyLicense,
  checkUserModuleLicense,
} from '~/server/services/license'

/** Matches current generateLicenseKey(): MOD-{base36}-{4..8 chars}-{1..4 hex checksum} */
const LICENSE_KEY_PATTERN = /^MOD-[a-z0-9]+-[a-z0-9]{4,8}-[a-f0-9]{1,4}$/

describe('License Service', () => {
  beforeEach(() => {
    mockQuery.mockReset()
  })

  describe('generateLicenseKey', () => {
    it('should generate valid license keys', () => {
      const key1 = generateLicenseKey()
      const key2 = generateLicenseKey()

      expect(key1).not.toBe(key2)
      expect(key1).toMatch(LICENSE_KEY_PATTERN)
      expect(key2).toMatch(LICENSE_KEY_PATTERN)
    })

    it('should generate unique keys', () => {
      const keys = new Set<string>()
      for (let i = 0; i < 100; i++) {
        keys.add(generateLicenseKey())
      }
      expect(keys.size).toBe(100)
    })
  })

  describe('createLicense', () => {
    it('should create a permanent license', async () => {
      mockQuery.mockResolvedValueOnce({ insertId: 101 })

      const license = await createLicense({
        orderId: 1,
        moduleKey: 'test-module',
        userId: 1,
        type: 'permanent',
      })

      expect(mockQuery).toHaveBeenCalledTimes(1)
      expect(license.moduleKey).toBe('test-module')
      expect(license.userId).toBe(1)
      expect(license.type).toBe('permanent')
      expect(license.status).toBe('active')
      expect(license.validUntil).toBeUndefined()
      expect(license.licenseKey).toMatch(LICENSE_KEY_PATTERN)
      expect(license.id).toBe(101)
    })

    it('should create a subscription license with 30-day validity', async () => {
      mockQuery.mockResolvedValueOnce({ insertId: 102 })

      const beforeCreation = new Date()
      const license = await createLicense({
        orderId: 2,
        moduleKey: 'test-module',
        userId: 2,
        type: 'subscription',
      })
      const afterCreation = new Date()

      expect(license.type).toBe('subscription')
      expect(license.validUntil).toBeDefined()

      const validUntil = new Date(license.validUntil!)
      const expectedMin = new Date(beforeCreation.getTime() + 29 * 24 * 60 * 60 * 1000)
      const expectedMax = new Date(afterCreation.getTime() + 31 * 24 * 60 * 60 * 1000)

      expect(validUntil.getTime()).toBeGreaterThan(expectedMin.getTime())
      expect(validUntil.getTime()).toBeLessThan(expectedMax.getTime())
    })

    it('should create a trial license with 7-day validity', async () => {
      mockQuery.mockResolvedValueOnce({ insertId: 103 })

      const beforeCreation = new Date()
      const license = await createLicense({
        orderId: 3,
        moduleKey: 'test-module',
        userId: 3,
        type: 'trial',
      })
      const afterCreation = new Date()

      expect(license.type).toBe('trial')
      expect(license.validUntil).toBeDefined()

      const validUntil = new Date(license.validUntil!)
      const expectedMin = new Date(beforeCreation.getTime() + 6 * 24 * 60 * 60 * 1000)
      const expectedMax = new Date(afterCreation.getTime() + 8 * 24 * 60 * 60 * 1000)

      expect(validUntil.getTime()).toBeGreaterThan(expectedMin.getTime())
      expect(validUntil.getTime()).toBeLessThan(expectedMax.getTime())
    })
  })

  describe('verifyLicense', () => {
    it('should verify an active license', async () => {
      mockQuery.mockResolvedValueOnce([
        {
          id: 1,
          license_key: 'TEST-KEY-1234',
          module_key: 'test-module',
          user_id: 1,
          type: 'permanent',
          status: 'active',
          valid_until: null,
          activations_used: 0,
          max_activations: 1,
        },
      ])

      const result = await verifyLicense({ licenseKey: 'TEST-KEY-1234' })

      expect(result.isValid).toBe(true)
      expect(result.license?.licenseKey).toBe('TEST-KEY-1234')
      expect(result.license?.moduleKey).toBe('test-module')
    })

    it('should return false for expired license', async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            id: 1,
            license_key: 'EXPIRED-KEY-1234',
            module_key: 'test-module',
            user_id: 1,
            type: 'trial',
            status: 'active',
            valid_until: '2020-01-01T00:00:00.000Z',
            activations_used: 0,
            max_activations: 1,
          },
        ])
        .mockResolvedValueOnce({})

      const result = await verifyLicense({ licenseKey: 'EXPIRED-KEY-1234' })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('License expired')
    })

    it('should return false for invalid license key', async () => {
      mockQuery.mockResolvedValueOnce([])

      const result = await verifyLicense({ licenseKey: 'INVALID-KEY' })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('License not found or inactive')
    })
  })

  describe('activateLicense', () => {
    it('should activate license on new device', async () => {
      mockQuery
        // find license
        .mockResolvedValueOnce([
          {
            id: 1,
            license_key: 'ACTIVATE-KEY-1234',
            module_key: 'test-module',
            user_id: 1,
            type: 'permanent',
            status: 'active',
            valid_until: null,
            activations_used: 0,
            max_activations: 3,
          },
        ])
        // existing activation
        .mockResolvedValueOnce([])
        // insert activation
        .mockResolvedValueOnce({})
        // update activations_used
        .mockResolvedValueOnce({})
        // reload license
        .mockResolvedValueOnce([
          {
            id: 1,
            license_key: 'ACTIVATE-KEY-1234',
            module_key: 'test-module',
            user_id: 1,
            type: 'permanent',
            status: 'active',
            valid_until: null,
            activations_used: 1,
            max_activations: 3,
            last_activated_at: new Date().toISOString(),
          },
        ])

      const result = await activateLicense({
        licenseKey: 'ACTIVATE-KEY-1234',
        deviceId: 'device-123',
        deviceName: 'My Laptop',
      })

      expect(result.activationsUsed).toBe(1)
      expect(result.lastActivatedAt).toBeDefined()
    })

    it('should fail to activate if max activations exceeded', async () => {
      mockQuery.mockResolvedValueOnce([
        {
          id: 1,
          license_key: 'MAX-ACTIVATIONS-KEY',
          module_key: 'test-module',
          user_id: 1,
          type: 'permanent',
          status: 'active',
          valid_until: null,
          activations_used: 3,
          max_activations: 3,
        },
      ])

      await expect(
        activateLicense({
          licenseKey: 'MAX-ACTIVATIONS-KEY',
          deviceId: 'device-456',
        }),
      ).rejects.toThrow('Maximum activations exceeded')
    })
  })

  describe('checkUserModuleLicense', () => {
    it('should return true if user has active license', async () => {
      mockQuery.mockResolvedValueOnce([
        {
          id: 1,
          status: 'active',
        },
      ])

      const hasLicense = await checkUserModuleLicense(1, 'test-module')
      expect(hasLicense).toBe(true)
    })

    it('should return false if user has no license', async () => {
      mockQuery.mockResolvedValueOnce([])

      const hasLicense = await checkUserModuleLicense(2, 'test-module')
      expect(hasLicense).toBe(false)
    })
  })
})
