"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest'
];
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets';

// 1. Define the shape of your state
interface GoogleConfig {
    apiKey: string;
    clientId: string;
    isInitialized: boolean;
    tokenClient: any;
    accessToken: string | null;
    userProfile: { name: string; email: string } | null;
    error: string | null;
}

// 2. Define the shape of the Context
interface GoogleContextType {
    config: GoogleConfig;
    setConfig: React.Dispatch<React.SetStateAction<GoogleConfig>>;
    initializeGapi: () => Promise<void>;
    handleAuthClick: () => void;
    handleSignOut: () => void;
}

const GoogleContext = createContext<GoogleContextType | null>(null);

export const GoogleProvider = ({ children }: { children: React.ReactNode }) => {
    // 3. Apply the Interface to useState so TypeScript knows 'null' is just a starting value
    const [config, setConfig] = useState<GoogleConfig>({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        isInitialized: false,
        tokenClient: null,
        accessToken: null,
        userProfile: null,
        error: null
    });

    useEffect(() => {
        const loadScript = (src: string, id: string) => {
            return new Promise((resolve, reject) => {
                if (document.getElementById(id)) { resolve(true); return; }
                const script = document.createElement("script");
                script.src = src;
                script.id = id;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        };
        Promise.all([
            loadScript("https://apis.google.com/js/api.js", "gapi-script"),
            loadScript("https://accounts.google.com/gsi/client", "google-identity-script")
        ]).catch(err => console.error("Failed to load Google scripts", err));
    }, []);

    const initializeGapi = async () => {
        if (!config.apiKey || !config.clientId) {
            setConfig(prev => ({ ...prev, error: "Please enter both API Key and Client ID" }));
            return;
        }
        try {
            await new Promise((resolve: any, reject) => {
                window.gapi.load('client', { callback: resolve, onerror: reject });
            });
            await window.gapi.client.init({
                apiKey: config.apiKey,
                discoveryDocs: DISCOVERY_DOCS,
            });
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: config.clientId,
                scope: SCOPES,
                callback: (tokenResponse: any) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        setConfig(prev => ({ 
                            ...prev, 
                            accessToken: tokenResponse.access_token,
                            userProfile: { name: "Google User", email: "Connected" } 
                        }));
                    }
                },
            });
            setConfig(prev => ({ ...prev, isInitialized: true, tokenClient, error: null }));
        } catch (error: any) {
            console.error("GAPI Init Error:", error);
            setConfig(prev => ({ ...prev, error: `Initialization Failed: ${error.message || JSON.stringify(error)}` }));
        }
    };

    const handleAuthClick = () => {
        if (config.tokenClient) {
            if (window.gapi.client.getToken() === null) {
                config.tokenClient.requestAccessToken({prompt: 'consent'});
            } else {
                config.tokenClient.requestAccessToken({prompt: ''});
            }
        }
    };

    const handleSignOut = () => {
        const token = window.gapi.client.getToken();
        if (token !== null) {
            window.google.accounts.oauth2.revoke(token.access_token, () => {});
            // 4. FIX: Use null instead of '' to clear the token
            window.gapi.client.setToken(null);
            setConfig(prev => ({ ...prev, accessToken: null, userProfile: null }));
        }
    };

    return (
        <GoogleContext.Provider value={{ config, setConfig, initializeGapi, handleAuthClick, handleSignOut }}>
            {children}
        </GoogleContext.Provider>
    );
};

// Helper hook to use the context
export const useGoogle = () => {
    const context = useContext(GoogleContext);
    if (!context) {
        throw new Error("useGoogle must be used within a GoogleProvider");
    }
    return context;
};

// 5. Global Type Declarations to prevent 'window.gapi' errors
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}