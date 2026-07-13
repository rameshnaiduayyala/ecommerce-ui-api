export class UserRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findByEmail(email) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  }

  async findById(id) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  }

  async create(userData) {
    return this.prisma.user.create({
      data: userData,
      include: {
        role: true
      }
    });
  }

  async update(id, updateData) {
    return this.prisma.user.update({
      where: { id },
      data: updateData
    });
  }

  async incrementLoginAttempts(userId) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: {
          increment: 1
        }
      }
    });
  }

  // Sessions Management
  async createSession(sessionData) {
    return this.prisma.session.create({
      data: sessionData
    });
  }

  async findSessionByToken(refreshToken) {
    return this.prisma.session.findFirst({
      where: { refreshToken, isValid: true },
      include: {
        user: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async invalidateSession(sessionId) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { isValid: false }
    });
  }

  async invalidateAllUserSessions(userId) {
    return this.prisma.session.updateMany({
      where: { userId, isValid: true },
      data: { isValid: false }
    });
  }
}
