# Security(not fixed)

- Invalidate refresh Tokens immediately after generating new one with access Token

# Fix bug(fixed)

in select partnership if user unlock level 4 by payment and unlock level three by proper fullfillment or payment then it is overwriting the status of level 4 and making it isUnlockedByPayment = false

# Fix bug(fixed)

handle the edge case where next level is already unlocked as when we complete the level we also upgrade user to the next level but since it is already unlocked it just endup creating duppicate of next unlocked level

# Update env on server

I need to update env on server to make things fully functional

# Have to set cron job

Cron job will clear the orphaned files after certain amount of time on server (dashboard feature)
