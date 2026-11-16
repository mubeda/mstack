"""Upload of order files, with one retry after a timeout."""
import time


def upload(client, data, retries=1, timeout=2.0):
    attempts = 0
    while True:
        attempts += 1
        try:
            return client.post("/v2/upload", data, timeout=timeout), attempts
        except TimeoutError:
            if attempts > retries:
                raise
            time.sleep(0.1)
