# Ask VIRELI Agent Data

This folder is the handoff point for the daily Ask VIRELI agents.

- `prompts.jsonl`: generated Ask VIRELI-ready prompts. One JSON object per line.
- `responses.jsonl`: creative ideal VIRELI responses for prompts in `prompts.jsonl`. One JSON object per line.
- `run-log.md`: short daily notes about what each agent added.

Prompt records should include:

- `id`
- `created_at`
- `category`
- `situation`
- `user_role`
- `prompt`
- `safety_level`
- `tags`

Response records should include:

- `prompt_id`
- `created_at`
- `response`
- `signals_to_watch`
- `follow_up_question`
- `response_style`
