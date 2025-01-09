import sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";
import { User } from "@db/schema";

// Email template for match recommendations
const matchTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    .match-card {
      border: 1px solid #e5e7eb;
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 0.5rem;
    }
    .match-percentage {
      color: #065f46;
      background-color: #d1fae5;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      display: inline-block;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <h1>Your Weekly Match Recommendations</h1>
  <p>Hi {{name}},</p>
  <p>Here are your top matches this week:</p>

  {{#each matches}}
  <div class="match-card">
    <h2>{{name}}</h2>
    <p>{{age}} • {{gender}} • {{location}}</p>
    <span class="match-percentage">{{matchPercentage}}% Match</span>
    <p>{{publicDescription}}</p>
  </div>
  {{/each}}

  <p>Login to your account to connect with these matches!</p>
</body>
</html>
`;

// Create template function
const template = Handlebars.compile(matchTemplate);

// Configure SendGrid
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable is required");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface MatchRecommendation {
  user: User;
  matches: Array<User & { matchPercentage: number }>;
}

export async function sendMatchRecommendations({ user, matches }: MatchRecommendation) {
  try {
    const html = template({
      name: user.name,
      matches: matches.slice(0, 5), // Send top 5 matches
    });

    const msg = {
      to: user.email,
      from: 'your-verified-sender@yourdomain.com', // Must be verified in SendGrid
      subject: 'Your Weekly Match Recommendations',
      html,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}