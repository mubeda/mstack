from app.upload import upload


class SlowOnce:
    def __init__(self):
        self.calls = 0

    def post(self, path, data, timeout):
        self.calls += 1
        if self.calls == 1:
            raise TimeoutError
        return "ok"


def test_retry_after_timeout():
    result, attempts = upload(SlowOnce(), b"orders")
    assert result == "ok"
    assert attempts == 2, "expected 2 attempts, got %d" % attempts
