FROM node:20-alpine

WORKDIR /app 
# thiết lập thu muc làm việc trong container là /app

COPY package*.json ./
RUN npm install

COPY . . 
# copy toàn bộ source code vào container
# không copy toàn bộ source code vào container ngay từ đầu vì khi chỉ cần sửa một file js, docker sẽ phải chạy lại npm install, rất tốn tg

EXPOSE 3000 
# khai báo cổng 3000 để container có thể lắng nghe các request từ bên ngoài

CMD ["npm", "start"]

# Tải image node:20-alpine.
# Tạo thư mục /app.
# Copy package.json và package-lock.json.
# Chạy npm install.
# Copy toàn bộ source code.
# Tạo image hoàn chỉnh.
