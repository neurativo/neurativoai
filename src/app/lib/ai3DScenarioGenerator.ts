interface Question {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    correct: boolean;
  }>;
  explanation: string;
}

interface ScenarioObject {
  id: string;
  type: 'box' | 'sphere' | 'cylinder' | 'plane';
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  interactive: boolean;
  label?: string;
}

interface Scenario {
  type: 'physics' | 'biology' | 'geography' | 'chemistry' | 'math' | 'history' | 'general';
  objects: ScenarioObject[];
}

export class AI3DScenarioGenerator {
  private static async callOpenAI(prompt: string): Promise<any> {
    const response = await fetch('/api/generate-3d-scenario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate 3D scenario');
    }

    return response.json();
  }

  static async generateScenarioForQuestion(question: Question, content: string): Promise<Scenario | null> {
    try {
      // Analyze the question and content to determine the best 3D scenario
      const prompt = `
Analyze this quiz question and content to create an appropriate 3D interactive scenario.

Question: "${question.question}"
Content Context: "${content.substring(0, 1000)}..."

Determine the best 3D scenario type and create interactive objects that would help answer this question.

Return a JSON object with this structure:
{
  "type": "physics|biology|geography|chemistry|math|history|general",
  "objects": [
    {
      "id": "object1",
      "type": "box|sphere|cylinder|plane",
      "position": [x, y, z],
      "size": [width, height, depth],
      "color": "#hexcolor",
      "interactive": true|false,
      "label": "Object Label"
    }
  ]
}

Guidelines:
- Choose scenario type based on content (physics for mechanics, biology for cells, etc.)
- Create 2-6 interactive objects that relate to the question
- Use appropriate colors and sizes
- Make objects clickable if they represent answer choices
- Position objects in a logical 3D arrangement
- Use labels for clarity

If no suitable 3D scenario can be created, return null.
`;

      const result = await this.callOpenAI(prompt);
      return result.scenario || null;
    } catch (error) {
      console.error('Error generating 3D scenario:', error);
      return null;
    }
  }

  static async generateScenariosForQuiz(questions: Question[], content: string): Promise<Question[]> {
    const enhancedQuestions = await Promise.all(
      questions.map(async (question) => {
        const scenario = await this.generateScenarioForQuestion(question, content);
        return {
          ...question,
          scenario
        };
      })
    );

    return enhancedQuestions;
  }

  // Fallback scenarios for common question types
  static getFallbackScenario(question: Question): Scenario | null {
    const questionText = question.question.toLowerCase();
    
    // Physics scenarios
    if (questionText.includes('lever') || questionText.includes('pulley') || questionText.includes('force')) {
      return {
        type: 'physics',
        objects: [
          {
            id: 'lever',
            type: 'box',
            position: [0, 0, 0],
            size: [4, 0.1, 0.2],
            color: '#8B4513',
            interactive: true,
            label: 'Lever'
          },
          {
            id: 'fulcrum',
            type: 'cylinder',
            position: [0, -1, 0],
            size: [0.1, 0.1, 0.5],
            color: '#C0C0C0',
            interactive: false,
            label: 'Fulcrum'
          },
          {
            id: 'weight',
            type: 'box',
            position: [-1.5, 0.5, 0],
            size: [0.5, 0.5, 0.5],
            color: '#FF6B6B',
            interactive: true,
            label: 'Weight'
          }
        ]
      };
    }

    // Biology scenarios
    if (questionText.includes('cell') || questionText.includes('organelle') || questionText.includes('mitochondria')) {
      return {
        type: 'biology',
        objects: [
          {
            id: 'nucleus',
            type: 'sphere',
            position: [0, 0, 0],
            size: [1.2, 1.2, 1.2],
            color: '#4A90E2',
            interactive: true,
            label: 'Nucleus'
          },
          {
            id: 'mitochondria',
            type: 'sphere',
            position: [1.5, 0.5, 0],
            size: [0.8, 0.8, 0.8],
            color: '#7ED321',
            interactive: true,
            label: 'Mitochondria'
          },
          {
            id: 'ribosome',
            type: 'sphere',
            position: [-1.5, -0.5, 0],
            size: [0.4, 0.4, 0.4],
            color: '#F5A623',
            interactive: true,
            label: 'Ribosome'
          }
        ]
      };
    }

    // Geography scenarios
    if (questionText.includes('continent') || questionText.includes('country') || questionText.includes('globe')) {
      return {
        type: 'geography',
        objects: [
          {
            id: 'globe',
            type: 'sphere',
            position: [0, 0, 0],
            size: [2, 2, 2],
            color: '#4A90E2',
            interactive: false,
            label: 'Earth'
          },
          {
            id: 'africa',
            type: 'box',
            position: [0, 0, 2.1],
            size: [0.8, 0.3, 0.1],
            color: '#8B4513',
            interactive: true,
            label: 'Africa'
          },
          {
            id: 'asia',
            type: 'box',
            position: [1.2, 0.3, 2.1],
            size: [1.0, 0.3, 0.1],
            color: '#FF6B6B',
            interactive: true,
            label: 'Asia'
          }
        ]
      };
    }

    // Math scenarios
    if (questionText.includes('equation') || questionText.includes('formula') || questionText.includes('calculate')) {
      return {
        type: 'math',
        objects: [
          {
            id: 'equation',
            type: 'plane',
            position: [0, 0, 0],
            size: [3, 2, 0.1],
            color: '#2D3748',
            interactive: false,
            label: 'Equation'
          },
          {
            id: 'variable1',
            type: 'box',
            position: [-1, 0, 0.1],
            size: [0.5, 0.5, 0.1],
            color: '#4CAF50',
            interactive: true,
            label: 'X'
          },
          {
            id: 'variable2',
            type: 'box',
            position: [1, 0, 0.1],
            size: [0.5, 0.5, 0.1],
            color: '#2196F3',
            interactive: true,
            label: 'Y'
          }
        ]
      };
    }

    return null;
  }
}
