from tags import normalize_tags


def test_order_is_kept():
    assert normalize_tags(["Beta", "alpha", "beta"]) == ["beta", "alpha"]
