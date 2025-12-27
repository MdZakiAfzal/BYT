FROM node:20-alpine

# 1. Add ffmpeg: yt-dlp needs this to merge video/audio or extract audio for AI processing
RUN apk add --no-cache python3 curl ffmpeg

# 2. Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./

# 3. Install dependencies
RUN npm install

COPY . .

# 4. Render uses a dynamic PORT. We expose 10000 as a convention, 
# but your code must use process.env.PORT
ENV PORT=10000
EXPOSE 10000

# 5. CRITICAL: Use "start", not "dev". 
# "dev" usually runs nodemon (bad for production memory/cpu)
CMD ["npm", "start"]