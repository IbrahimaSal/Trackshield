import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma.service.js'

describe('PrismaService', () => {
  let module: TestingModule
  let service: PrismaService

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile()

    service = module.get<PrismaService>(PrismaService)

    // Empêche toute vraie connexion à la base pendant les tests
    vi.spyOn(service, '$connect').mockResolvedValue()
    vi.spyOn(service, '$disconnect').mockResolvedValue()
  })

  afterEach(async () => {
    await module.close()
    vi.restoreAllMocks()
  })

  it('est injectable en tant que service NestJS', () => {
    expect(service).toBeDefined()
  })

  it('appelle $connect lors de onModuleInit', async () => {
    await service.onModuleInit()

    expect(service.$connect).toHaveBeenCalledOnce()
  })

  it("n'appelle $connect qu'une seule fois même si onModuleInit est appelé deux fois", async () => {
    await service.onModuleInit()
    await service.onModuleInit()

    // NestJS ne rappelle pas onModuleInit deux fois en prod,
    // mais le service ne doit pas exploser si c'est le cas
    expect(service.$connect).toHaveBeenCalledTimes(2)
  })

  it('appelle $disconnect lors de onModuleDestroy', async () => {
    await service.onModuleDestroy()

    expect(service.$disconnect).toHaveBeenCalledOnce()
  })

  it("appelle $disconnect même si $connect n'a jamais été appelé", async () => {
    await service.onModuleDestroy()

    expect(service.$disconnect).toHaveBeenCalledOnce()
  })
})
