# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory in the container
WORKDIR /code

# Set the environment variable for the cache directory
ENV HF_HOME=/code/.cache

# --- START OF THE FIX ---
# Create the cache directory and grant permissions to the default user.
# The default user in this python image is 'non-root' (UID 1000).
# We create the directory and then change its ownership.
RUN mkdir -p /code/.cache && \
    chown -R 1000:1000 /code
# --- END OF THE FIX ---

# Copy the requirements file into the container
COPY ./requirements.txt /code/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of your application code
COPY . /code/

# Expose the port the app runs on
EXPOSE 7860

# Define the command to run your app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
