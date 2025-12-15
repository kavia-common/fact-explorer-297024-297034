#!/bin/bash
cd /home/kavia/workspace/code-generation/fact-explorer-297024-297034/facts_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

