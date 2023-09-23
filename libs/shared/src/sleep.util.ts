export function sleep(timeout = 0): Promise<void> {
    return new Promise((resolve) => {
        if (timeout === 0) {
            setImmediate(resolve);
        } else {
            setTimeout(resolve, timeout);
        }
    });
}
