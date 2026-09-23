class AppError(Exception):
    def __init__(self, message: str, status_code: int = 500, is_operational: bool = True):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.is_operational = is_operational
