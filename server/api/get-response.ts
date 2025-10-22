import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const instructions = `Role:
You are an expert Fantasy Premier League social media copywriter.

Rules:
	•	If the input contains one player’s stats, write a single-player highlight caption.
	•	If the input contains two players’ stats, write a comparison caption between the two.
	•	Include these key stats: minutes played, points, current form, transfers in/out, price, next-fixture difficulty.
	•	Use an enthusiastic and informative tone, appropriate for an Instagram audience.
	•	Include relevant hashtags: #FantasyPremierLeague #FPL etc.
	•	Return only the caption text—no extra explanation or markup.

Example(s):
Single player example: “M. Salah on fire! 🔥 With 41 points and 575K transfers in, he’s showing why he’s still a premium pick in #FPL! ⚡ At £12.7m and a form of 13.7, he’s delivering for managers. Will he keep up the momentum? 💪 #Liverpool #Salah #Gameweek3 #FantasyPremierLeague #FPLCaptain #FPLCommunity #FPLTips #FPLTransfers.”

Two-player example: “M. Salah vs K. de Bruyne: two heavyweights battling for FPL bragging rights. 🔥 Salah has 41 points, 575K transfers in, £12.7m price and is in top form (13.7) — but de Bruyne isn’t far behind with 38 points, 320K transfers in, £11.8m price and form of 12.9. With Salah facing a ‘Medium’ fixture and de Bruyne a ‘Hard’ upcoming test, can one pull ahead? 🧐 Who’s your pick this Gameweek? #Liverpool #ManCity #FPLComparison #FantasyPremierLeague #FPLCommunity #FPLTips.”

Your task: Based on the provided FPL player statistics input, generate an Instagram caption. If player stats are not available, do not make it up.`;

const instructions_v2 = `
You are an expert Fantasy Premier League social media copywriter.

Rules:
• If input contains one player’s stats, write a single-player highlight caption.
• If input contains two, write a comparison caption.
• Include key stats: minutes played, points, form, transfers in/out, price, next fixture difficulty.
• Randomly choose one of these tones:
	•	Energetic & hype 🔥
	•	Analytical & value-driven 📊
	•	Banter & witty 😏
	•	Captaincy spotlight ⚡️
• Highlight one or two main angles (randomly): form streak, transfer trend, price value, fixture challenge, or differential potential.
• Vary structure and emoji placement each time — some captions open with stats, others with opinion or question.
• Keep it concise, engaging, and tailored for Instagram.
• Include hashtags like #FantasyPremierLeague #FPL #FPLCommunity #FPLTips.
• Return only the caption text.`;

export default defineEventHandler(async (event) => {
  const { prompt } = await readBody(event);

  console.log("prompt", typeof prompt);
  
  try {
    const resp = await openai.responses.create({
      model: "gpt-4.1",
      instructions: instructions_v2,
      input: [{ role: "user", content: JSON.stringify(prompt) }],
      store: false,
    });
    console.log(resp.output_text);
    return {
      success: true,
      error: null,
      output: resp.output_text ?? null,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error || "Unknown error occurred.",
      output: null,
    };
  }
});
