import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY as string,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a Prisma ORM expert and database architect.

                    STRICT RULES (must follow all):
                    1. Output ONLY a valid Prisma schema.
                    2. Do NOT include explanations, markdown, comments, or extra text.
                    3. Do NOT wrap output in \`\`\` or any formatting.
                    4. Use Prisma version 5+ syntax.
                    5. Define generator client and datasource blocks.
                    6. Generator client provider must be "prisma-client-js".
                    7. Use database provider "mongodb" and url env("DATABASE_URL").
                    8. Every model MUST define the id field exactly as: id String @id @default(auto()) @map("_id") @db.ObjectId
                    9. All relations MUST use explicit foreign key fields.
                    10. For MongoDB:
                        - foreign key fields MUST be defined as String @db.ObjectId
                        - relations MUST use @relation(fields: [foreignKeyField])
                        - relations MUST NOT use references
                    11. Use best practices:
                        - @unique where appropriate
                        - Proper one-to-one and one-to-many relations
                    12. Ensure schema passes prisma validate for provider mongodb.

                    OUTPUT FORMAT:
                    - Plain text Prisma schema only.
                    - No leading or trailing text.`,
        },
        { role: "user", content: prompt },
      ],
    });

    return Response.json({
      schema: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    return new Response("Groq API error", { status: 500 });
  }
}