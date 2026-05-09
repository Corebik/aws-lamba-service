 const schema = {
  type: 'object',
  properties: {
    body: {
      type: 'string',
      minLength: 1,
      pattern: '^data:image\\/\\w+;base64,', // Ensure the string starts with the expected data URI scheme
    },
  },
  required: ['body'],
};
 
export default schema;