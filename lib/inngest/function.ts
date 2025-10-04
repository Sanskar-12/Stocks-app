/* eslint-disable @typescript-eslint/no-explicit-any */
import { getNews } from "../actions/finnhub-actions";
import { getAllUsersForNewsEmail } from "../actions/user-actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist-actions";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailer";
import { formatDateToday } from "../utils";
import { inngest } from "./client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompt";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  {
    event: "app/user.created",
  },
  async ({ event, step }) => {
    const userProfile = `
        - Country:${event.data.country}
        - Investment goals:${event.data.investmentGoals}
        - Risk tolerance:${event.data.riskTolerance}
        - Preferred industry:${event.data.preferredIndustry}
    `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({
        model: "gemini-2.5-flash-lite-preview-06-17",
      }),
      body: {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.";

      // Send email logic
      const {
        data: { name, email },
      } = event;

      return await sendWelcomeEmail({
        email,
        name,
        intro: introText,
      });
    });

    return {
      success: true,
      message: "Welcome Email send successfully",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  {
    id: "daily-news-summary",
  },
  [
    {
      event: "app/send.daily.news",
    },
    {
      cron: "30 6 * * *",
    },
  ],
  async ({ step }) => {
    // Get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0) {
      return {
        success: false,
        message: "No users found for news email",
      };
    }

    // Get all the news articles according to each user's symbols
    const results = await step.run("fetch-news-per-user", async () => {
      const perUser: { user: User; articles: any[] }[] = [];

      // looping for every users
      for (const user of users) {
        try {
          // Fetching the symbol according to every user
          const symbols = await getWatchlistSymbolsByEmail(user.email);

          // Fetching the news articles according to the symbols of the users
          let articles = await getNews(symbols);

          // fetching only 6 articles
          articles = (articles || []).slice(0, 6);

          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }

          perUser.push({
            user,
            articles,
          });
        } catch (error) {
          console.log(
            "daily-news: Error preparing user news",
            user.email,
            error
          );
          perUser.push({
            user,
            articles: [],
          });
        }
      }

      return perUser;
    });

    // summarize all the news with AI
    const userNewsSummaries: {
      user: User;
      newsContent: string | null;
    }[] = [];

    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsDetail}}",
          JSON.stringify(articles, null, 2)
        );

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({
            model: "gemini-2.5-flash-lite-preview-06-17",
          }),
          body: {
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news.";

        userNewsSummaries.push({
          user,
          newsContent,
        });
      } catch (error) {
        console.log("Failed to summarize news for: ", user.email, error);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Send the news Summary to all the users through their email
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: formatDateToday,
            newsContent,
          });
        })
      );
    });

    return {
      success: true,
      message: "Daily news Summary emails send Successfully",
    };
  }
);
