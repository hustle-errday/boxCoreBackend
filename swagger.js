const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Document API",
    description: "swagger kick box client core",
    contact: {
      name: "Anujin",
      email: "anujinaa1205@gmail.com",
    },
  },
  host: "192.168.1.92:9000",
  schemes: ["http"],
};

const outputFile = "./swaggerDoc.json";
const endpointsFiles = ["./index.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
