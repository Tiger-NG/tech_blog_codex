import { hash } from 'bcryptjs'
import { PrismaClient, Role, PostStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@techblog.local'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!'
  const adminName = process.env.ADMIN_NAME ?? 'Admin'

  const hashedPassword = await hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: Role.ADMIN,
      hashedPassword
    },
    create: {
      name: adminName,
      email: adminEmail,
      hashedPassword,
      role: Role.ADMIN
    }
  })

  console.log(`Seeded admin user:\n  Email: ${admin.email}\n  Temporary Password: ${adminPassword}`)

  // 创建测试文章
  const testPosts = [
    {
      title: '欢迎来到技术博客',
      slug: 'welcome-to-tech-blog',
      excerpt: '这是第一篇测试文章，欢迎来到我们的技术博客平台。',
      content: '这是第一篇测试文章的完整内容。在这里我们将分享技术经验和开发心得。',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: admin.id
    },
    {
      title: 'Nuxt.js 开发指南',
      slug: 'nuxtjs-development-guide',
      excerpt: '学习如何使用 Nuxt.js 构建现代化的全栈应用。',
      content: 'Nuxt.js 是一个基于 Vue.js 的通用应用框架，提供了服务端渲染、静态站点生成等功能。',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: admin.id
    },
    {
      title: 'Prisma 数据库操作',
      slug: 'prisma-database-operations',
      excerpt: '掌握 Prisma ORM 的基本用法和高级特性。',
      content: 'Prisma 是一个现代化的 Node.js 和 TypeScript ORM，提供了类型安全的数据库访问。',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: admin.id
    }
  ]

  for (const postData of testPosts) {
    await prisma.post.upsert({
      where: { slug: postData.slug },
      update: postData,
      create: postData
    })
  }

  console.log('Seeded 3 test posts')
}

main()
  .catch((error) => {
    console.error('Seeding failed', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
