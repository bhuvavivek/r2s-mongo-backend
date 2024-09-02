# Use the official Node.js image as a base
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install -g npm@latest
#RUN npm install express

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 8080

# Set environment variables
ENV DATABASE_URL="mysql://admin:Return112@ls-3009ec90a11419ead3108a205bf7558f5e83673c.crpntzf9fujt.ap-south-1.rds.amazonaws.com:3306/dbr2s"
ENV JWT_SECRET_KEY="DF983kjhfqn7@$@%*bjbfh12_"
ENV TWILIO_ACCOUNT_SID="AC2c33fdacc74f16e49ea2bade0e41b5ed"
ENV TWILIO_TOKEN="577c2fcbfded526c05cf5a0e6762a228"
ENV SMS_SECRET_KEY="xu678d3hy3u3hybuj3"
ENV TWILIO_PHONE_NUMBER="+12057378232"
ENV NODE_ENV="dev"
ENV ORDER_SECRET_KEY="dnuby6bsh75b87h7"
ENV RAZORPAY_API_ID="rzp_test_lZkcO3ue9calBg"
ENV RAZORPAY_API_SECRECT="02MBkdaLiEFd1PRFBoofHoI4"

# Command to run the application
CMD ["node", "dist/index.js"]
