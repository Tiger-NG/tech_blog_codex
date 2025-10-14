import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const result = await prisma.$queryRaw`SELECT 1 AS one`
  console.log(result)
} catch (error) {
  console.error(error)
} finally {
  await prisma.$disconnect()
}
