#!/bin/bash

API="http://localhost:4741"
URL_PATH="/memories"

curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
    "memory": {
      "title": "'"${TITLE}"'",
      "description": "'"${DESC}"'",
      "date": "'"${DATE}"'"
    }
  }'

echo
