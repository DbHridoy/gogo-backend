export const Errors = {
  AlreadyExists: {
    code: 409,
    message: "Document already exist",
  },
  NotFound: {
    code: 404,
    message: "Document not found",
  },
  Unauthorized: {
    code: 401,
    message: "Wrong credentials",
  },
  NoToken: {
    code: 401,
    message: "No token provided",
  },
  InvalidToken:{
    code:401,
    message:"Invalid token"
  },
  Forbidden: {
    code: 403,
    message: "Insufficient permission",
  },
  EnumValue:{
    code:400,
    message:"Invalid enum value"
  }
};
