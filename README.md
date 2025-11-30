# contextual-llm-privacy

cs 279r final project built with React + TypeScript + Vite.

A privacy configuration generator that creates tailored markdown files for AI coding assistants based on your project's context, risk level, and compliance requirements.

## Running locally

1. Install dependencies (first time only):

   ```sh
   npm install
   ```

2. Set up environment variables (optional, required for AI generation):
   Create a `.env` file in the root directory:

   ```sh
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

   Or use:

   ```sh
   VITE_OPENAI_KEY=your_openai_api_key_here
   ```

   > **Note:** The app will work without an API key, but you won't be able to generate the final `cursor.md` file. You can still complete the survey and see the preview.

3. Start the dev server:

   ```sh
   npm run dev
   ```

4. Open the URL (default `http://localhost:5173`) in your browser.

## How to Use

### Step 1: Start the Survey

Click "Start survey" on the landing page. The survey takes approximately 3 minutes and consists of 11 questions.

### Step 2: Answer the Questions

Navigate through the questions using "Next" and "Back" buttons. Each question includes helper text explaining what information is needed.

**Question Overview:**

1. **Project Name** - A label for your project (e.g., "Compilers final project")
2. **Project Type** - Choose: Coursework, Research, Proprietary, or Personal
3. **Repo Visibility** - Private/invite-only, Public/shared, or Air-gapped/offline
4. **Data Sensitivity** - Low, Medium, or High sensitivity level
5. **Highest Risk Area** - Source code, Datasets, Credentials, or Documentation
6. **Data Examples** - Optional: List specific risky files or datasets
7. **Compliance** - Select applicable: FERPA, HIPAA, Corporate NDA, Internal policy, or None
8. **AI Usage** - How you'll use the assistant: Sparingly, Paired, or Autonomous
9. **Collaboration** - Solo builder, Small team, or Cross-organization
10. **Storage** - Where code/data lives: Local encrypted, Local plain, Cloud-synced, or Shared drive
11. **Reminders** - Privacy reminders you want: Session audits, Data minimization, Delete after export, or Manual redaction

### Step 3: Review Your Assessment

After completing all questions, you'll see a review screen showing:

- **Risk Level** - Your calculated risk posture (Low, Guarded, Elevated, or Critical)
- **Risk Score** - A score from 1-8 based on your responses
- **Focus Areas** - Key protection areas identified
- **Guardrails** - Specific privacy rules recommended
- **Watchwords** - Important privacy keywords to monitor

### Step 4: Generate markdown

Click the button to create your configuration file. This requires an OpenAI API key (see setup above). The generated file will include:

- Context snapshot of your project
- Assistant guardrails tailored to your risk level
- Session reminders based on your preferences
- Risk posture summary

### Step 5: Use Your Configuration

- **Copy** the generated content
- **Paste** it into your repository root as the relevant file (`cursor.md` or `CLAUDE.md`)
- The file will guide your AI coding assistant (like Cursor IDE) on privacy boundaries

You can also **Edit answers** to refine your configuration or **Start new survey** for a different project.

## Interpreting Results

### Risk Levels Explained

**Low Exposure** (Score 1-2)

- Context is contained; keep lightweight checklists in place
- Suitable for: Personal projects, low-sensitivity coursework, solo work with minimal AI usage

**Guarded Posture** (Score 3-4)

- Blend of sensitive and public files; audit sharing each session
- Suitable for: Coursework with some sensitive data, small teams, paired AI usage

**Elevated Risk** (Score 5-6)

- Multiple collaborators or regulated data; default to opt-in access
- Suitable for: Research projects, proprietary work with NDAs, cross-org collaboration

**Critical Controls Required** (Score 7-8)

- Strict NDAs or embargoed datasets; treat AI as read-only until vetted
- Suitable for: High-sensitivity research, strict corporate NDAs, autonomous AI usage with sensitive data
