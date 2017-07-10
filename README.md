# Adopt A Pet Alexa Skill
An Amazon Alexa skill for adopting pets.

## Setup
Setup of Alexa skill is required, please refer to Amazon's documentation.

## Building
Use `ts-node test/test.ts <Intent Name>` to run the local test function using mock data.
Use `gulp lambda` to deploy to AWS lambda.  Must have an AWS credentials file in `(User Profile)/.aws/credentials`.
Use `ts-node util/schemaUtterancesHelper.ts` to generate Alexa Skills Kit schema and utterances.
