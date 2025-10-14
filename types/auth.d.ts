import type { DefaultSession } from '@auth/core/types'
import type { Role } from '@prisma/client'

declare module '@auth/core/types' {
  interface Session {
    user?: DefaultSession['user'] & {
      id: string
      role: Role
    }
  }

  interface User {
    role: Role
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}
