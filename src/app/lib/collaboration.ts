/**
 * Collaborative study pack system
 */

export interface StudyPackShare {
  id: string;
  studyPackId: string;
  ownerId: string;
  shareCode: string;
  permissions: 'view' | 'edit' | 'admin';
  expiresAt?: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface StudyPackCollaborator {
  id: string;
  studyPackId: string;
  userId: string;
  email: string;
  name: string;
  role: 'viewer' | 'editor' | 'admin';
  joinedAt: Date;
  lastActive: Date;
}

export interface StudyPackComment {
  id: string;
  studyPackId: string;
  sectionId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isResolved: boolean;
  replies: StudyPackComment[];
}

export interface StudyPackChange {
  id: string;
  studyPackId: string;
  userId: string;
  userName: string;
  type: 'note_edit' | 'flashcard_add' | 'flashcard_edit' | 'quiz_add' | 'comment_add';
  sectionId: string;
  content: any;
  timestamp: Date;
}

export class CollaborationManager {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/collaboration') {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a shareable link for a study pack
   */
  async createShare(
    studyPackId: string,
    permissions: 'view' | 'edit' | 'admin' = 'view',
    expiresInHours?: number
  ): Promise<StudyPackShare> {
    const response = await fetch(`${this.baseUrl}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studyPackId,
        permissions,
        expiresInHours
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create share link');
    }

    return response.json();
  }

  /**
   * Join a study pack using share code
   */
  async joinStudyPack(shareCode: string): Promise<StudyPackCollaborator> {
    const response = await fetch(`${this.baseUrl}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shareCode }),
    });

    if (!response.ok) {
      throw new Error('Failed to join study pack');
    }

    return response.json();
  }

  /**
   * Get collaborators for a study pack
   */
  async getCollaborators(studyPackId: string): Promise<StudyPackCollaborator[]> {
    const response = await fetch(`${this.baseUrl}/${studyPackId}/collaborators`);
    
    if (!response.ok) {
      throw new Error('Failed to get collaborators');
    }

    return response.json();
  }

  /**
   * Update collaborator permissions
   */
  async updateCollaborator(
    studyPackId: string,
    userId: string,
    role: 'viewer' | 'editor' | 'admin'
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${studyPackId}/collaborators/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      throw new Error('Failed to update collaborator');
    }
  }

  /**
   * Remove collaborator
   */
  async removeCollaborator(studyPackId: string, userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${studyPackId}/collaborators/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to remove collaborator');
    }
  }

  /**
   * Add comment to a section
   */
  async addComment(
    studyPackId: string,
    sectionId: string,
    content: string
  ): Promise<StudyPackComment> {
    const response = await fetch(`${this.baseUrl}/${studyPackId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sectionId,
        content
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    return response.json();
  }

  /**
   * Get comments for a section
   */
  async getComments(studyPackId: string, sectionId: string): Promise<StudyPackComment[]> {
    const response = await fetch(`${this.baseUrl}/${studyPackId}/comments/${sectionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get comments');
    }

    return response.json();
  }

  /**
   * Reply to a comment
   */
  async replyToComment(
    studyPackId: string,
    commentId: string,
    content: string
  ): Promise<StudyPackComment> {
    const response = await fetch(`${this.baseUrl}/${studyPackId}/comments/${commentId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to reply to comment');
    }

    return response.json();
  }

  /**
   * Resolve a comment
   */
  async resolveComment(studyPackId: string, commentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${studyPackId}/comments/${commentId}/resolve`, {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error('Failed to resolve comment');
    }
  }

  /**
   * Get recent changes for a study pack
   */
  async getRecentChanges(studyPackId: string): Promise<StudyPackChange[]> {
    const response = await fetch(`${this.baseUrl}/${studyPackId}/changes`);
    
    if (!response.ok) {
      throw new Error('Failed to get recent changes');
    }

    return response.json();
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToUpdates(
    studyPackId: string,
    onUpdate: (change: StudyPackChange) => void
  ): () => void {
    // In a real implementation, this would use WebSockets or Server-Sent Events
    // For now, we'll use polling
    const interval = setInterval(async () => {
      try {
        const changes = await this.getRecentChanges(studyPackId);
        changes.forEach(change => onUpdate(change));
      } catch (error) {
        console.error('Failed to fetch updates:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }

  /**
   * Check if user has permission for action
   */
  async hasPermission(
    studyPackId: string,
    action: 'view' | 'edit' | 'admin'
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${studyPackId}/permissions/${action}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get share link info
   */
  async getShareInfo(shareCode: string): Promise<{
    studyPackId: string;
    permissions: string;
    expiresAt?: string;
    isActive: boolean;
  }> {
    const response = await fetch(`${this.baseUrl}/share/${shareCode}`);
    
    if (!response.ok) {
      throw new Error('Invalid share code');
    }

    return response.json();
  }

  /**
   * Revoke share link
   */
  async revokeShare(studyPackId: string, shareId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/share/${shareId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to revoke share link');
    }
  }

  /**
   * Get all share links for a study pack
   */
  async getShareLinks(studyPackId: string): Promise<StudyPackShare[]> {
    const response = await fetch(`${this.baseUrl}/${studyPackId}/shares`);
    
    if (!response.ok) {
      throw new Error('Failed to get share links');
    }

    return response.json();
  }
}

// Global instance
export const collaborationManager = new CollaborationManager();
