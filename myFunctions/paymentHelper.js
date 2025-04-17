const axios = require("axios");
const cron = require("node-cron");

const getQPayAccessToken = async () => {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${process.env.QPAY_AUTH_URL}`,
        {},
        {
          auth: {
            username: process.env.QPAY_USERNAME,
            password: process.env.QPAY_PASSWORD,
          },
        }
      )
      .then(async (res) => {
        const token = res.data.access_token;
        resolve(token);
      })
      .catch((error) => {
        console.log(error);
        resolve();
      });
  });
};

const generateQPayPayment = async (qPayObject, token) => {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${process.env.QPAY_BASE_URL}/invoice`,
        { ...qPayObject },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(async (res) => {
        resolve(res.data);
      })
      .catch((error) => {
        console.log(error);
        resolve();
      });
  });
};

const qPayAccessCron = async () => {
  //when server restarts, this function will be called
  const accessTokenServerRestart = await getQPayAccessToken();
  console.log("accessToken on server restart:");

  if (!accessTokenServerRestart) {
    //if accessToken is not generated, we're gonnat to get it one more time
    const accessTokenServerRestartTry = await getQPayAccessToken();
    if (accessTokenServerRestartTry) {
      process.env.QPAY_ACCESS_TOKEN = accessTokenServerRestartTry;

      console.log("on second try: ");
      console.log(process.env.QPAY_ACCESS_TOKEN);
    }
  }
  if (accessTokenServerRestart) {
    process.env.QPAY_ACCESS_TOKEN = accessTokenServerRestart;
    console.log("on first try: ");
    console.log(process.env.QPAY_ACCESS_TOKEN);
  }

  //this function should work in every 4 hours
  cron.schedule("0 */8 * * *", async () => {
    const accessToken = await getQPayAccessToken();
    if (accessToken) {
      process.env.QPAY_ACCESS_TOKEN = accessToken;
      console.log("cron job: ");
      console.log(process.env.QPAY_ACCESS_TOKEN);
    }
    if (!accessToken) {
      console.log("cron job: accessToken is not generated on first try");
      const accessTokenTry = await getQPayAccessToken();
      if (accessTokenTry) {
        process.env.QPAY_ACCESS_TOKEN = accessTokenTry;
        console.log("cron job: accessToken is generated on second try");
        console.log(process.env.QPAY_ACCESS_TOKEN);
      }
    }
  });
};

const checkPayment = async (qpayObject) => {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${process.env.QPAY_BASE_URL}/payment/check`,
        { ...qpayObject },
        {
          headers: {
            Authorization: `Bearer ${process.env.QPAY_ACCESS_TOKEN}`,
          },
        }
      )
      .then(async (res) => {
        resolve(res.data);
      })
      .catch((error) => {
        console.log(error);
        resolve();
      });
  });
};

module.exports = {
  qPayAccessCron,
  generateQPayPayment,
  checkPayment,
};
