export const getClientIp = (request: Request, getClientAddress: () => string) => {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) {
        return xff.split(',')[0].trim();
    }
    return getClientAddress();
}