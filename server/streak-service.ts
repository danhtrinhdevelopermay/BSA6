import { storage } from "./storage";

export class StreakService {
  /**
   * Check and update user's daily streak when they visit the app
   */
  async updateDailyStreak(userId: number): Promise<{ updated: boolean; newStreak: number; celebrateStreak: boolean }> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastActive = user.lastActive ? new Date(user.lastActive) : null;
      const lastActiveDate = lastActive ? new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()) : null;

      let newStreak = user.streak || 0;
      let updated = false;
      let celebrateStreak = false;

      // If this is the first visit today
      if (!lastActiveDate || lastActiveDate.getTime() !== today.getTime()) {
        updated = true;

        if (!lastActiveDate) {
          // First time user
          newStreak = 1;
          celebrateStreak = true;
        } else {
          const daysDifference = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDifference === 1) {
            // Consecutive day - increment streak
            newStreak = (user.streak || 0) + 1;
            celebrateStreak = true;
          } else if (daysDifference > 1) {
            // Missed day(s) - reset streak
            newStreak = 1;
            celebrateStreak = true;
          }
          // If daysDifference === 0, it means same day (shouldn't happen due to our check above)
        }

        // Update user's streak and last active date
        await storage.updateUser(userId, {
          streak: newStreak,
          lastActive: now,
        });
      }

      return {
        updated,
        newStreak,
        celebrateStreak: updated && celebrateStreak,
      };
    } catch (error) {
      console.error("Error updating daily streak:", error);
      return {
        updated: false,
        newStreak: 0,
        celebrateStreak: false,
      };
    }
  }

  /**
   * Get streak celebration message based on streak count
   */
  getStreakCelebrationMessage(streak: number): string {
    if (streak === 1) {
      return "Welcome back! Your learning journey begins! 🌟";
    } else if (streak === 3) {
      return "3 days in a row! You're building momentum! 🔥";
    } else if (streak === 7) {
      return "One week streak! You're on fire! 🔥🔥";
    } else if (streak === 14) {
      return "Two weeks! You're becoming unstoppable! ⚡";
    } else if (streak === 30) {
      return "30 days! Learning champion! 🏆";
    } else if (streak === 100) {
      return "100 days! You're a learning legend! 👑";
    } else if (streak % 10 === 0) {
      return `${streak} days streak! Keep up the amazing work! 🎉`;
    } else {
      return `${streak} days in a row! Keep it going! 💪`;
    }
  }
}

export const streakService = new StreakService();