const { Client, logger } = require("camunda-external-task-client-js");
var nodemailer = require("nodemailer");
const userMails = require("./emails.json");

// configuration for the Client:
//  - 'baseUrl': url to the Process Engine
//  - 'logger': utility to automatically log important events
//  - 'asyncResponseTimeout': long polling timeout (then a new request will be issued)
const config = {
  baseUrl: "http://localhost:8080/engine-rest",
  use: logger,
  asyncResponseTimeout: 5000
};

// create a Client instance with custom configuration
const client = new Client(config);

// susbscribe to the topic: 'charge-card'
client.subscribe("send-newsletter", async function({ task, taskService }) {
  // Put your business logic here

  // Get a process variable from the task
  const title = task.variables.get("title");
  const lead = task.variables.get("lead");
  const text = task.variables.get("text");
  const email = task.variables.get("email");
  const link = task.variables.get("link");
  const sendToAllUsers = task.variables.get("send_to_all_users");

  // check if the "send to all users" checkbox has been activated
  if (sendToAllUsers) {
    stringOfMails = await getAllUserMails();
    await sendEmail(stringOfMails, title, text, lead, link);
  }

  // if "send to all users" checkbox is not checked, send the mail to the inserted email
  await sendEmail(email, title, text, lead, link);

  //_________________________________
  //
  //            FUNCTIONS
  //
  //_________________________________

  /**
   * @async - getAllUserMails
   * @returns - a String with all user emails from a json file
   * @description - key in the loop is needed to prevent that the first email starts with a ","
   */
  async function getAllUserMails() {
    let stringOfMails = "";
    userMails.map((user, key) => {
      if (key === 0) {
        stringOfMails += `${user.email}`;
      }
      stringOfMails += `, ${user.email}`;
    });
    return stringOfMails;
  }

  /**
   * @async sendEmail
   * @param email - email address(es) to send the mail to
   * @param title - title of the mail
   * @param text - text of the mail
   * @param lead - lead of the mail
   * @param link - page link, if receiver clicks on the button
   */
  async function sendEmail(email, title, text, lead, link) {
    // transporter / host which will send the mail
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "kevintester1993@gmail.com",
        pass: "kevinTester123"
      }
    });

    // the email that will be sent written in html template
    var mailOptions = {
      from: "Your favorite company",
      to: `${email}`,
      subject: `${title}`,
      text: `${text}`,
      html: `<div style="border-radius: 5px; background-color: #5b6472; padding: 5px;">
  <div style="text-align: center;">
  <h1 style="color: white; font-family: helvetica;">
  ${title}
  </h1>
    <P style="font-family: helvetica; color: white">
    ${lead}
    </P>
    <p style="font-family: helvetica; color: white;">
    ${text}
    </p>
    <a style="text-decoration: none;" href="${link}">
      <button style="font-size: 20px;color:white; font-family: helvetica; width: 60%;margin: 20px 0; border: none; background-color: #6dcdf9; height: 50px; border-radius: 10px;">
        Check it out here
      </button>
    </a>
        <p style="font-family: helvetica; color: white;">
    We appreciate your support and want to say THANK YOU!
    </p>
    <img style="width: 150px;" src="https://uilogos.co/img/logotype/circle.png" />
  </div>
</div>`
    };

    // the point, where the email will be sent and catch the error
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    // Complete the task
    await taskService.complete(task);
  }
});
