// src/Data/testData.js

export const getTestsForFunctionAndVersion = (functionId, versionName) => {
    const allTests = [
      // Tests for Function 1: Translate Text
      // Version v1.0
      {
        id: 1,
        functionId: 'function1',
        version: 'v1.0',
        prompt: 'Translate the following text to French:',
        model: 'GPT-4',
        input: {
          text: 'Hello, how are you?',
        },
        modelOutput: {
          translation: 'Salut, comment vas-tu ?',
          evaluationScore: {
            accuracy: 0.95,
            fluency: 0.92,
          },
        },
      },
      {
        id: 2,
        functionId: 'function1',
        version: 'v1.0',
        prompt: 'Translate the following text to French:',
        model: 'GPT-4',
        input: {
          text: 'Good morning!',
        },
        modelOutput: {
          translation: 'Bon matin!',
          evaluationScore: {
            accuracy: 0.94,
            fluency: 0.9,
          },
        },
      },
      {
        id: 3,
        functionId: 'function1',
        version: 'v1.0',
        prompt: 'Translate the following text to French:',
        model: 'GPT-4',
        input: {
          text: 'Thank you for your help.',
        },
        modelOutput: {
          translation: 'Merci pour votre aide.',
          evaluationScore: {
            accuracy: 0.96,
            fluency: 0.93,
          },
        },
      },
      // Additional API calls for v1.0
      {
        id: 4,
        functionId: 'function1',
        version: 'v1.0',
        prompt: 'Translate the following text to French:',
        model: 'GPT-4',
        input: {
          text: 'Where is the nearest restaurant?',
        },
        modelOutput: {
          translation: 'Où est le restaurant le plus proche?',
          evaluationScore: {
            accuracy: 0.92,
            fluency: 0.89,
          },
        },
      },
      {
        id: 5,
        functionId: 'function1',
        version: 'v1.0',
        prompt: 'Translate the following text to French:',
        model: 'GPT-4',
        input: {
          text: 'I need to book a hotel room.',
        },
        modelOutput: {
          translation: 'Je dois réserver une chambre d\'hôtel.',
          evaluationScore: {
            accuracy: 0.93,
            fluency: 0.9,
          },
        },
      },
  
      // Version v1.1
      {
        id: 6,
        functionId: 'function1',
        version: 'v1.1',
        prompt: 'Translate the following text to French. Be accurate and fluent:',
        model: 'GPT-4',
        input: {
          text: 'Hello, how are you?',
        },
        modelOutput: {
          translation: 'Bonjour, comment ça va?',
          evaluationScore: {
            accuracy: 0.97,
            fluency: 0.95,
          },
        },
      },
      {
        id: 7,
        functionId: 'function1',
        version: 'v1.1',
        prompt: 'Translate the following text to French. Be accurate and fluent:',
        model: 'GPT-4',
        input: {
          text: 'Good evening!',
        },
        modelOutput: {
          translation: 'Bonsoir!',
          evaluationScore: {
            accuracy: 0.96,
            fluency: 0.94,
          },
        },
      },
      {
        id: 8,
        functionId: 'function1',
        version: 'v1.1',
        prompt: 'Translate the following text to French. Be accurate and fluent:',
        model: 'GPT-4',
        input: {
          text: 'Could you please pass the salt?',
        },
        modelOutput: {
          translation: 'Pourriez-vous passer le sel, s\'il vous plaît?',
          evaluationScore: {
            accuracy: 0.98,
            fluency: 0.96,
          },
        },
      },
      // Additional API calls for v1.1
      {
        id: 9,
        functionId: 'function1',
        version: 'v1.1',
        prompt: 'Translate the following text to French. Be accurate and fluent:',
        model: 'GPT-4',
        input: {
          text: 'I would like to rent a car.',
        },
        modelOutput: {
          translation: 'Je voudrais louer une voiture.',
          evaluationScore: {
            accuracy: 0.95,
            fluency: 0.93,
          },
        },
      },
      {
        id: 10,
        functionId: 'function1',
        version: 'v1.1',
        prompt: 'Translate the following text to French. Be accurate and fluent:',
        model: 'GPT-4',
        input: {
          text: 'What time does the train arrive?',
        },
        modelOutput: {
          translation: 'À quelle heure arrive le train?',
          evaluationScore: {
            accuracy: 0.96,
            fluency: 0.94,
          },
        },
      },
  
      // Tests for Function 2: Summarize Article
      // Version v1.0
      {
        id: 11,
        functionId: 'function2',
        version: 'v1.0',
        prompt: 'Summarize the following article:',
        model: 'GPT-3.5',
        input: {
          text: 'The economy has been experiencing significant growth over the past quarter...',
        },
        modelOutput: {
          summary: 'The economy grew significantly in the last quarter.',
          evaluationScore: {
            relevance: 0.9,
            coherence: 0.88,
          },
        },
      },
      {
        id: 12,
        functionId: 'function2',
        version: 'v1.0',
        prompt: 'Summarize the following article:',
        model: 'GPT-3.5',
        input: {
          text: 'The company reported a decrease in profits due to increased operational costs...',
        },
        modelOutput: {
          summary: 'The company\'s profits decreased because of higher operational costs.',
          evaluationScore: {
            relevance: 0.88,
            coherence: 0.85,
          },
        },
      },
      // Additional API calls for v1.0
      {
        id: 13,
        functionId: 'function2',
        version: 'v1.0',
        prompt: 'Summarize the following article:',
        model: 'GPT-3.5',
        input: {
          text: 'A new study shows the health benefits of a plant-based diet...',
        },
        modelOutput: {
          summary: 'Plant-based diets offer significant health benefits according to a new study.',
          evaluationScore: {
            relevance: 0.9,
            coherence: 0.87,
          },
        },
      },
  
      // Version v1.1
      {
        id: 14,
        functionId: 'function2',
        version: 'v1.1',
        prompt: 'Summarize the following article concisely:',
        model: 'GPT-3.5',
        input: {
          text: 'Researchers have developed a new method for storing energy that could revolutionize the industry...',
        },
        modelOutput: {
          summary: 'A new energy storage method may revolutionize the industry.',
          evaluationScore: {
            relevance: 0.92,
            coherence: 0.9,
          },
        },
      },
      {
        id: 15,
        functionId: 'function2',
        version: 'v1.1',
        prompt: 'Summarize the following article concisely:',
        model: 'GPT-3.5',
        input: {
          text: 'The local government has implemented new policies to improve public transportation...',
        },
        modelOutput: {
          summary: 'New policies aim to enhance public transportation.',
          evaluationScore: {
            relevance: 0.91,
            coherence: 0.89,
          },
        },
      },
      // Additional API calls for v1.1
      {
        id: 16,
        functionId: 'function2',
        version: 'v1.1',
        prompt: 'Summarize the following article concisely:',
        model: 'GPT-3.5',
        input: {
          text: 'Advancements in AI technology are rapidly changing various industries...',
        },
        modelOutput: {
          summary: 'AI advancements are rapidly transforming industries.',
          evaluationScore: {
            relevance: 0.93,
            coherence: 0.91,
          },
        },
      },
  
      // Tests for Function 3: Sentiment Analysis
      // Version v1.0
      {
        id: 17,
        functionId: 'function3',
        version: 'v1.0',
        prompt: 'Determine the sentiment of the following text:',
        model: 'GPT-3.5',
        input: {
          text: 'I absolutely love this product! It exceeded my expectations.',
        },
        modelOutput: {
          sentiment: 'Positive',
          evaluationScore: {
            accuracy: 0.98,
          },
        },
      },
      {
        id: 18,
        functionId: 'function3',
        version: 'v1.0',
        prompt: 'Determine the sentiment of the following text:',
        model: 'GPT-3.5',
        input: {
          text: 'This was the worst service I have ever experienced.',
        },
        modelOutput: {
          sentiment: 'Negative',
          evaluationScore: {
            accuracy: 0.96,
          },
        },
      },
      {
        id: 19,
        functionId: 'function3',
        version: 'v1.0',
        prompt: 'Determine the sentiment of the following text:',
        model: 'GPT-3.5',
        input: {
          text: 'The movie was okay, but I expected more action.',
        },
        modelOutput: {
          sentiment: 'Neutral',
          evaluationScore: {
            accuracy: 0.94,
          },
        },
      },
      // Additional API calls for v1.0
      {
        id: 20,
        functionId: 'function3',
        version: 'v1.0',
        prompt: 'Determine the sentiment of the following text:',
        model: 'GPT-3.5',
        input: {
          text: 'I am extremely disappointed with the recent update.',
        },
        modelOutput: {
          sentiment: 'Negative',
          evaluationScore: {
            accuracy: 0.95,
          },
        },
      },
  
      // Tests for Function 4: Extract Entities
      // Version v1.0
      {
        id: 21,
        functionId: 'function4',
        version: 'v1.0',
        prompt: 'Extract entities from the following text:',
        model: 'GPT-4',
        input: {
          text: 'Apple Inc. announced the release of the new iPhone on September 14th in Cupertino.',
        },
        modelOutput: {
          entities: [
            { type: 'Organization', text: 'Apple Inc.' },
            { type: 'Product', text: 'iPhone' },
            { type: 'Date', text: 'September 14th' },
            { type: 'Location', text: 'Cupertino' },
          ],
          evaluationScore: {
            precision: 0.95,
            recall: 0.9,
          },
        },
      },
      {
        id: 22,
        functionId: 'function4',
        version: 'v1.0',
        prompt: 'Extract entities from the following text:',
        model: 'GPT-4',
        input: {
          text: 'Microsoft and Google are competing in the cloud computing market.',
        },
        modelOutput: {
          entities: [
            { type: 'Organization', text: 'Microsoft' },
            { type: 'Organization', text: 'Google' },
          ],
          evaluationScore: {
            precision: 0.93,
            recall: 0.88,
          },
        },
      },
      // Additional API calls for v1.0
      {
        id: 23,
        functionId: 'function4',
        version: 'v1.0',
        prompt: 'Extract entities from the following text:',
        model: 'GPT-4',
        input: {
          text: 'Elon Musk plans to send humans to Mars by 2024 through SpaceX.',
        },
        modelOutput: {
          entities: [
            { type: 'Person', text: 'Elon Musk' },
            { type: 'Location', text: 'Mars' },
            { type: 'Date', text: '2024' },
            { type: 'Organization', text: 'SpaceX' },
          ],
          evaluationScore: {
            precision: 0.94,
            recall: 0.9,
          },
        },
      },
  
      // Tests for Function 5: Language Detection
      // Version v1.0
      {
        id: 24,
        functionId: 'function5',
        version: 'v1.0',
        prompt: 'Detect the language of the following text:',
        model: 'GPT-3.5',
        input: {
          text: 'Hola, ¿cómo estás?',
        },
        modelOutput: {
          language: 'Spanish',
          evaluationScore: {
            accuracy: 0.99,
          },
        },
      },
      {
        id: 25,
        functionId: 'function5',
        version: 'v1.0',
        prompt: 'Detect the language of the following text:',
        model: 'GPT-3.5',
        input: {
          text: 'Bonjour tout le monde',
        },
        modelOutput: {
          language: 'French',
          evaluationScore: {
            accuracy: 0.98,
          },
        },
      },
      // Additional API calls for v1.0
      {
        id: 26,
        functionId: 'function5',
        version: 'v1.0',
        prompt: 'Detect the language of the following text:',
        model: 'GPT-3.5',
        input: {
          text: 'こんにちは、お元気ですか？',
        },
        modelOutput: {
          language: 'Japanese',
          evaluationScore: {
            accuracy: 0.97,
          },
        },
      },
  
      // Tests for Function 1: Translate Text
      // Version v1.2 (Newer version)
      {
        id: 27,
        functionId: 'function1',
        version: 'v1.2',
        prompt: 'Translate the following text to French with formal tone:',
        model: 'GPT-4',
        input: {
          text: 'Could you please send me the report?',
        },
        modelOutput: {
          translation: 'Pourriez-vous m\'envoyer le rapport, s\'il vous plaît?',
          evaluationScore: {
            accuracy: 0.99,
            fluency: 0.97,
          },
        },
      },
      {
        id: 28,
        functionId: 'function1',
        version: 'v1.2',
        prompt: 'Translate the following text to French with formal tone:',
        model: 'GPT-4',
        input: {
          text: 'We appreciate your business.',
        },
        modelOutput: {
          translation: 'Nous apprécions votre entreprise.',
          evaluationScore: {
            accuracy: 0.98,
            fluency: 0.96,
          },
        },
      },
      // Additional API calls for v1.2
      {
        id: 29,
        functionId: 'function1',
        version: 'v1.2',
        prompt: 'Translate the following text to French with formal tone:',
        model: 'GPT-4',
        input: {
          text: 'Please confirm your attendance at the meeting.',
        },
        modelOutput: {
          translation: 'Veuillez confirmer votre présence à la réunion.',
          evaluationScore: {
            accuracy: 0.99,
            fluency: 0.97,
          },
        },
      },
  
      // Tests for Function 6: Text Classification
      // Version v1.0
      {
        id: 30,
        functionId: 'function6',
        version: 'v1.0',
        prompt: 'Classify the following text into categories: Sports, Politics, Technology, Health:',
        model: 'GPT-3.5',
        input: {
          text: 'The team won the championship after a thrilling game.',
        },
        modelOutput: {
          category: 'Sports',
          evaluationScore: {
            accuracy: 0.95,
          },
        },
      },
      {
        id: 31,
        functionId: 'function6',
        version: 'v1.0',
        prompt: 'Classify the following text into categories: Sports, Politics, Technology, Health:',
        model: 'GPT-3.5',
        input: {
          text: 'The new smartphone model features an advanced camera system.',
        },
        modelOutput: {
          category: 'Technology',
          evaluationScore: {
            accuracy: 0.94,
          },
        },
      },
      // Additional API calls for v1.0
      {
        id: 32,
        functionId: 'function6',
        version: 'v1.0',
        prompt: 'Classify the following text into categories: Sports, Politics, Technology, Health:',
        model: 'GPT-3.5',
        input: {
          text: 'The government passed a new healthcare bill.',
        },
        modelOutput: {
          category: 'Politics',
          evaluationScore: {
            accuracy: 0.93,
          },
        },
      },
  
      // You can continue adding more functions, versions, and tests as needed.
    ];
  
    return allTests.filter(
      (test) => test.functionId === functionId && test.version === versionName
    );
  };
  