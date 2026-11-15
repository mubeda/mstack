def normalize_tags(tags):
    """Return the tags lowercased, without duplicates."""
    return list({tag.strip().lower() for tag in tags})
