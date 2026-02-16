# @openclaw/constella-openclaw

OpenClaw plugin that connects to Constella external APIs and exposes two tools:

- `constella_search_notes`
- `constella_insert_note`

## Install

### From npm (official)

```bash
openclaw plugins install @openclaw/constella-openclaw
```

### Local dev install

```bash
openclaw plugins install -l /Users/tejas1/Documents/Constella\ Codebases/third_party/constella-openclaw
```

## Configure

Set plugin config in your OpenClaw config file:

```json
{
  "plugins": {
    "entries": {
      "constella-openclaw": {
        "enabled": true,
        "config": {
          "baseUrl": "https://fastfind.app",
          "apiKey": "csk_your_key_here"
        }
      }
    }
  }
}
```

## Enable the tools

Optional plugin tools must be allowlisted:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "allow": [
            "constella_search_notes",
            "constella_insert_note"
          ]
        }
      }
    ]
  }
}
```

## API endpoints used

- `POST /constella-external-api/retrieve-info`
- `POST /constella-external-api/insert-note`

Auth header sent by this plugin:

- `x_access_key: csk_...`
