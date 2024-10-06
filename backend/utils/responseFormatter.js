const formatResponse = (status, message, response = {}) => {
  return {
    s: status ? 1 : 0, // Status: 1 for success, 0 for error
    m: message, // Message
    r: response, // Response object or data
  };
};

export default formatResponse;
