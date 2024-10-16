export const getVersionTreeData = (functionId) => {
    const versionTreeData = {
      function1: {
        name: 'v1.0',
        attributes: {
          date: '2023-10-01',
          description: 'Initial version of Translate Text',
        },
        children: [
          {
            name: 'v1.1',
            attributes: {
              date: '2023-10-05',
              description: 'Improved translation accuracy',
            },
          },
            {
                name: 'v1.2',
                attributes: {
                date: '2023-10-10',
                description: 'Added support for multiple languages',
                },
                children: [
                    {
                        name: 'v1.2.1',
                        attributes: {
                        date: '2023-10-15',
                        description: 'Improved translation speed',
                        },
                    },
                ],
            },
        ],
      },
      function2: {
        name: 'v1.0',
        attributes: {
          date: '2023-10-02',
          description: 'Initial version of Summarize Article',
        },
        children: [
          {
            name: 'v1.1',
            attributes: {
              date: '2023-10-06',
              description: 'Added support for PDFs',
            },
          },
        ],
      },
      // Add more functions as needed
    };

    // console.log('functionId:', functionId);
    // console.log('versionTreeData:', versionTreeData[functionId]);
  
    return versionTreeData[functionId] || null;
  };
  