def normalize_tags(tags):
    """Lowercase tags and drop duplicates."""
    return list({t.strip().lower() for t in tags})
