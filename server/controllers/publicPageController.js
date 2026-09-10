const { queryOne, queryAll } = require('../database/database');

const DEFAULT_PAGES = {
  privacy: {
    title: 'Privacy Policy',
    content: `# Privacy Policy

**Last updated: January 1, 2026**

## 1. Who We Are

ClientRegit ("we," "us," or "our") is a client management and project collaboration platform built for video editors, freelancers, and creative professionals. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application and related services (collectively, the "Service").

By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree, please discontinue use of the Service immediately.

## 2. Information We Collect

We collect several categories of information to provide and improve the Service.

### 2.1 Account Information

When you create an account, we collect:

- Your full name
- Email address
- Password (stored securely as a bcrypt hash — we never store plaintext passwords)
- Phone number (optional)
- Profile avatar (optional)
- User role (user or admin)

This information is necessary to create and manage your account, authenticate you, and communicate with you about the Service.

### 2.2 Client Data

You may add information about your own clients within the Service. This includes:

- Client names, email addresses, phone numbers
- Company names, addresses, cities, states, and countries
- Client websites and notes
- Client status and lead source

This data is entered by you and stored in the Service on your behalf. You are responsible for ensuring that you have a lawful basis for collecting and storing this information.

### 2.3 Project and Task Data

The Service allows you to create projects, assign tasks, track progress, and manage deadlines. This includes:

- Project names, descriptions, budgets, and payment statuses
- Task titles, descriptions, priorities, due dates, and assignees
- Activity logs recording actions taken within the Service

### 2.4 Video Files and Comments

If you upload videos for client review, we store:

- Video file metadata (title, version, file size, status)
- The video file itself, stored on the server filesystem
- Video comments, including timestamps, comment text, and comment author information
- Guest comment information (name and email) if shared via a public link

Shared video links are accessible via a unique token. Anyone with the token can view the video and leave comments without an account.

### 2.5 Invoice and Payment Data

You may create invoices and record client payments within the Service. This includes:

- Invoice numbers, descriptions, amounts, issue dates, and due dates
- Client payment records (amounts, payment methods, dates, transaction IDs)
- Payment statuses

Note: Invoice and payment data you enter relates to your own business transactions with your clients. This is data you control and manage within the Service.

### 2.6 Billing and Subscription Information

When you subscribe to a paid plan, our payment processor Razorpay collects:

- Your name and email address
- Payment method details (credit/debit card number, UPI ID, or other method — processed directly by Razorpay, never stored on our servers)
- Billing address
- Transaction IDs and payment confirmation data
- Subscription status, plan details, and billing period information

We receive and store only the information Razorpay shares with us after a successful or failed transaction. We do not have access to your full card number or sensitive payment credentials.

### 2.7 IP Addresses and Server Logs

Like most web applications, we automatically log certain information when you use the Service:

- IP address
- Browser type and version
- Operating system
- Referring URLs
- Pages visited and time spent
- Date and time of requests
- HTTP status codes

These logs are used for security monitoring, debugging, and improving the Service. They are not used to personally identify you beyond what is necessary for security purposes.

### 2.8 Cookies and Local Storage

The Service uses the following types of browser storage:

- **Authentication token**: Stored in your browser's localStorage to keep you logged in. This is a JSON Web Token (JWT) that expires after 30 days.
- **Theme preference**: Stored to remember your light or dark mode preference.
- **Country and currency preferences**: Stored to remember your regional settings.

We do not use third-party tracking cookies. If advertising is enabled through your consent preferences, our advertising partners may set cookies as described in the Advertising Policy.

## 3. How We Use Your Information

We use the information we collect for the following purposes:

- To provide, maintain, and improve the Service
- To authenticate your identity and manage your account
- To process subscription payments through Razorpay
- To communicate with you about your account, updates, and support requests
- To monitor and analyze usage patterns to improve user experience
- To detect, prevent, and address technical issues and security threats
- To comply with legal obligations

We do not sell your personal information to third parties.

## 4. Data Retention

We retain your information for as long as your account is active or as needed to provide the Service. Specifically:

- **Account data**: Retained until you delete your account
- **Client, project, task, video, and invoice data**: Retained as long as your account is active
- **Server logs**: Retained for a maximum of 90 days
- **Billing records**: Retained for 7 years as required by Indian tax and financial regulations
- **Video files**: Retained until deleted by you or until your account is deleted

When you delete your account, all associated data is permanently removed from our active systems. Backup copies may persist for up to 30 days before automatic purging.

## 5. Data Security

We implement industry-standard security measures to protect your data:

- Passwords are hashed using bcrypt with a salt factor of 10
- All data in transit is encrypted via HTTPS/TLS
- Access to the server is restricted to authorized personnel only

However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee absolute security.

## 6. Third-Party Services

We use the following third-party services that may process your information:

### 6.1 Razorpay (Payment Processing)

Razorpay handles all payment processing. When you make a payment, Razorpay processes your payment method details directly. We receive only a confirmation, transaction ID, and limited billing information. Razorpay's use of your information is governed by their own privacy policy: https://razorpay.com/privacy/

### 6.2 Hosting Infrastructure

The Service is hosted on infrastructure providers that maintain the servers where your data is stored. Your data may be processed in the country where the hosting provider operates.

### 6.3 Email Communications

We may use your email address to send transactional emails related to your account (such as password resets, subscription confirmations, and important service updates). We do not send marketing emails without your explicit consent.

## 7. Data Sharing

We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except:

- To Razorpay, for the purpose of processing payments
- When required by law, regulation, or legal process
- To protect the rights, property, or safety of ClientRegit, our users, or the public
- In connection with a merger, acquisition, or sale of all or a portion of our assets, with prior notice to you

## 8. Your Rights

You have the following rights regarding your personal information:

- **Access**: You can request a copy of the personal data we hold about you
- **Correction**: You can update or correct your information at any time through the Service settings
- **Deletion**: You can delete your account and all associated data at any time through the Service settings
- **Data Portability**: You can export your client, project, and invoice data through the Service
- **Restriction**: You can request that we restrict processing of your data
- **Objection**: You can object to certain types of processing

To exercise any of these rights, please contact us at support@clientregit.com.

## 9. Children's Privacy

The Service is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete that information promptly.

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the "Last updated" date at the top. Your continued use of the Service after any changes constitutes acceptance of the updated policy.

## 11. Contact Us

If you have any questions about this Privacy Policy or our data practices, please contact us:

**Email**: support@clientregit.com

We aim to respond to all inquiries within 48 hours during business days.`,
  },

  terms: {
    title: 'Terms & Conditions',
    content: `# Terms & Conditions

**Last updated: January 1, 2026**

## 1. Acceptance of Terms

By accessing or using ClientRegit (the "Service"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, do not use the Service. We reserve the right to modify these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.

## 2. Eligibility

The Service is available only to individuals who are at least 18 years of age and have the legal capacity to enter into a binding agreement. By using the Service, you represent and warrant that you meet these eligibility requirements.

## 3. Account Creation

### 3.1 Registration

To use most features of the Service, you must create an account by providing your name, email address, and a secure password. You agree to provide accurate, current, and complete information during registration and to keep your account information up to date.

### 3.2 Account Security

You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:

- Choose a strong, unique password
- Not share your account credentials with anyone
- Notify us immediately at support@clientregit.com if you suspect unauthorized access
- Not allow others to access the Service through your account

We are not liable for any loss or damage arising from your failure to secure your account.

### 3.3 Account Roles

The Service supports two roles: user and admin. Users can manage clients, projects, tasks, videos, and invoices. Admins have additional privileges including managing billing, users, and system settings. You are responsible for assigning appropriate roles to team members.

## 4. Service Description

ClientRegit is a client management and project collaboration platform for creative professionals. The Service includes:

- Client relationship management
- Project tracking and management
- Task assignment and tracking
- Video upload, review, and approval workflows
- Invoice creation and payment tracking
- Client portal with shared video review links
- Subscription-based billing and plan management

We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.

## 5. Plans and Pricing

### 5.1 Free Plan

We offer a free plan with limited features and usage quotas. The free plan is subject to the following limits:

- Limited number of clients
- Limited number of projects
- Limited number of tasks
- Limited monthly invoice creation
- Limited monthly video uploads
- Limited storage space

Free plan limits are subject to change at our discretion.

### 5.2 Paid Plans

Paid plans offer expanded features and higher usage limits. Current plan details, pricing, and features are available on our pricing page at clientregit.com/pricing. Prices are displayed in your selected currency.

### 5.3 Price Changes

We reserve the right to change prices at any time. Price changes will not affect your current billing period. We will provide at least 30 days' notice before any price increase takes effect for existing subscribers.

## 6. Payments

### 6.1 Payment Processing

All payments are processed through Razorpay. By making a payment, you agree to Razorpay's terms of service and privacy policy. We do not store your credit card number, CVV, or other sensitive payment credentials on our servers.

### 6.2 Currency

Payments are processed in the currency you select during registration or checkout. You are responsible for any currency conversion fees charged by your bank or payment provider.

### 6.3 Taxes

You are responsible for any applicable taxes, duties, or charges imposed by your jurisdiction in connection with your use of the Service. Prices shown may or may not include taxes depending on your region.

### 6.4 Failed Payments

If a recurring payment fails, we will attempt to retry the payment up to three times over a 7-day period. If all retries fail, your subscription will be downgraded to the free plan at the end of the current billing period.

## 7. Subscriptions

### 7.1 Billing Cycles

Paid subscriptions are billed on a monthly, quarterly, or yearly basis, depending on the plan you select. One-time lifetime purchases are also available. Your subscription begins on the date of your first payment and renews automatically at the end of each billing period.

### 7.2 Auto-Renewal

Your subscription automatically renews at the end of each billing period unless you cancel before the renewal date. By subscribing, you authorize us to charge the subscription fee to your payment method at each renewal.

### 7.3 Access During Subscription

While your subscription is active, you have access to all features and usage limits included in your plan. If your subscription lapses or is cancelled, your account will be downgraded to the free plan and any data within paid-plan limits will be retained but may become read-only.

## 8. Cancellation

You may cancel your subscription at any time through the billing section of your account settings. Upon cancellation:

- Your subscription will remain active until the end of the current billing period
- You will retain access to paid features until the period ends
- At the end of the period, your account will be downgraded to the free plan
- No further charges will be made

We do not provide partial refunds for unused portions of a billing period.

## 9. Refunds

### 9.1 Subscription Refunds

Due to the nature of digital services, subscription fees are generally non-refundable. However, we may issue refunds in the following circumstances:

- **Duplicate payments**: If you were accidentally charged twice for the same billing period
- **Failed delivery**: If you paid but were never granted access to the Service
- **Billing errors**: If you were charged an incorrect amount due to a system error

### 9.2 One-Time Purchase Refunds

For any one-time purchases (such as lifetime plans), refunds may be requested within 7 days of purchase if you have not substantially used the Service. After 7 days or substantial use, refunds are not available.

### 9.3 How to Request a Refund

To request a refund, email support@clientregit.com with your name, email address, transaction details, and reason for the request. We aim to respond within 5 business days.

## 10. Coupons and Discounts

### 10.1 Coupon Validity

Coupons are valid only for the period and conditions specified when issued. Each coupon has a maximum number of uses and may be restricted to specific plans or currencies.

### 10.2 One Use Per Customer

Unless explicitly stated otherwise, each coupon may only be used once per customer account. Attempting to use a coupon more than once may result in the discount being reversed.

### 10.3 Non-Transferable

Coupons are non-transferable and cannot be exchanged for cash. They have no cash value.

## 11. Usage Limits

Your plan includes specific usage limits for clients, projects, tasks, monthly invoices, monthly video uploads, and storage. If you exceed your plan limits:

- You will be prompted to upgrade your plan
- You may be unable to create new items until you are within your limits
- Existing data will not be deleted

We reserve the right to enforce usage limits strictly and to modify limits with reasonable notice.

## 12. User Content

### 12.1 Ownership

You retain all ownership rights to content you create, upload, or store in the Service, including client data, project files, videos, and invoices. We do not claim ownership over your content.

### 12.2 License Grant

By using the Service, you grant us a limited, non-exclusive license to host, store, transmit, and display your content solely for the purpose of providing the Service to you. This license terminates when you delete your content or your account.

### 12.3 Content Responsibility

You are solely responsible for the content you create, upload, or share through the Service. You represent and warrant that you have all necessary rights and permissions to store and share your content.

## 13. Intellectual Property

The Service, including its design, code, features, branding, documentation, and all related intellectual property, is owned by ClientRegit and protected by applicable copyright, trademark, and other intellectual property laws. You may not:

- Copy, modify, distribute, sell, or lease any part of the Service
- Reverse engineer or attempt to extract the source code of the Service
- Use our branding, logos, or trademarks without written permission
- Create derivative works based on the Service

## 14. Acceptable Use

You agree not to use the Service to:

- Violate any applicable laws or regulations
- Infringe upon the rights of others
- Upload or distribute malicious software or code
- Attempt to gain unauthorized access to the Service or other users' accounts
- Interfere with or disrupt the Service or servers
- Use the Service for spam, phishing, or fraudulent purposes
- Resell or redistribute the Service without written permission
- Upload content that is obscene, defamatory, or harmful

Violations may result in suspension or termination of your account.

## 15. Termination

### 15.1 By You

You may terminate your account at any time through the account settings or by contacting support@clientregit.com. Upon termination, your data will be permanently deleted in accordance with our data retention policies.

### 15.2 By Us

We reserve the right to suspend or terminate your account at any time, with or without notice, for:

- Violation of these Terms
- Engaging in activity that is harmful to the Service or other users
- Non-payment of subscription fees
- Requests by law enforcement or government agencies

### 15.3 Effect of Termination

Upon termination:

- Your access to the Service will cease immediately
- All data associated with your account will be deleted within 30 days
- Outstanding payment obligations survive termination
- Sections of these Terms that by their nature should survive termination will survive

## 16. Disclaimers

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.

## 17. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CLIENTREGIT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, BUSINESS OPPORTUNITIES, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.

## 18. Governing Law

These Terms are governed by and construed in accordance with the laws of India, without regard to its conflict of laws principles. Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts in India.

## 19. Dispute Resolution

Before filing any legal action, you agree to contact us at support@clientregit.com and attempt to resolve the dispute informally. We will attempt to resolve any dispute within 30 days of receiving your notice. If informal resolution fails, either party may pursue formal remedies.

## 20. Severability

If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.

## 21. Entire Agreement

These Terms, together with our Privacy Policy, constitute the entire agreement between you and ClientRegit regarding the use of the Service and supersede all prior agreements and understandings, whether written or oral.

## 22. Changes to These Terms

We may revise these Terms from time to time by updating this page. We will notify you of material changes by posting a notice on the Service or sending you an email. Your continued use of the Service after changes are posted constitutes acceptance of the revised Terms.

## 23. Contact Us

If you have any questions about these Terms, please contact us:

**Email**: support@clientregit.com`,
  },

  cookies: {
    title: 'Cookie Policy',
    content: `# Cookie Policy

**Last updated: January 1, 2026**

## 1. What Are Cookies?

Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work efficiently, to provide information to website owners, and to improve user experience.

Cookies can be "session cookies" (which are deleted when you close your browser) or "persistent cookies" (which remain on your device for a set period or until you delete them).

## 2. How ClientRegit Uses Cookies

ClientRegit is a web application that uses a minimal number of browser storage mechanisms. Unlike traditional websites that rely heavily on cookies, ClientRegit primarily uses localStorage and session-based JWT tokens for authentication and preferences.

### 2.1 Authentication Token (localStorage)

When you log in to ClientRegit, a JSON Web Token (JWT) is stored in your browser's localStorage. This token:

- Keeps you authenticated across page refreshes
- Expires after 30 days
- Is removed when you log out
- Is not accessible to other websites or scripts

This is not a traditional cookie but serves a similar purpose. It is essential for the Service to function.

### 2.2 Theme Preference (localStorage)

ClientRegit stores your theme preference (light or dark mode) in localStorage. This allows the Service to remember your visual preference between visits.

### 2.3 Regional Preferences (localStorage)

Your selected country, currency, currency symbol, and phone code are stored in localStorage to maintain your regional settings across sessions.

### 2.4 Essential Session Storage

The Service uses browser localStorage for the following purposes:

- **Authentication**: To maintain your authenticated session via a JWT token
- **Theme preference**: To remember your light or dark mode preference
- **Regional settings**: To remember your country and currency preferences

No session cookies are set by the Service. Authentication is managed entirely through localStorage and HTTP Authorization headers.

## 3. Third-Party Cookies

When Google AdSense is enabled by the administrator, Google may set advertising cookies on your device. When Google Analytics is configured, analytics cookies may be set. These features are optional and can be managed through the cookie consent banner.

If you access the Service through a shared video link, no additional cookies are set beyond those described in this policy.

## 4. Cookies We Do NOT Use

To be clear, ClientRegit does **not** use:

- **Social media cookies**: We do not embed social media widgets that set tracking cookies
- **Preference cookies from third parties**: We do not use third-party services that remember your preferences via cookies

## 5. Essential Cookies

The following data is stored locally in your browser for the Service to operate:

| Storage Key | Purpose | Duration | Type |
|---|---|---|---|
| JWT token | Authentication and session management | 30 days | LocalStorage |
| Theme preference | Remembers light/dark mode choice | Persistent | LocalStorage |
| Regional settings | Remembers country and currency preferences | Persistent | LocalStorage |
| Cookie consent | Records your cookie preferences | Persistent | LocalStorage |

## 6. How to Manage Cookies

You can control and manage cookies through your browser settings. Here is how to manage cookies in popular browsers:

### 6.1 Google Chrome

1. Click the three-dot menu in the top-right corner
2. Go to Settings > Privacy and Security > Cookies and other site data
3. Choose your preferred cookie settings

### 6.2 Mozilla Firefox

1. Click the hamburger menu in the top-right corner
2. Go to Settings > Privacy & Security
3. Under Cookies and Site Data, choose your preferred settings

### 6.3 Safari

1. Go to Safari > Preferences > Privacy
2. Under Cookies and website data, choose your preferred settings

### 6.4 Microsoft Edge

1. Click the three-dot menu in the top-right corner
2. Go to Settings > Cookies and site permissions > Cookies and site data
3. Choose your preferred settings

### 6.5 Important Note

Disabling essential cookies or localStorage may prevent you from using the Service. The authentication token stored in localStorage is required for the Service to function properly. If you clear your browser data or disable localStorage, you will be logged out and may need to re-enter your preferences.

## 7. Do Not Track Signals

Some browsers offer a "Do Not Track" (DNT) signal. There is currently no industry standard for how websites should respond to DNT signals. ClientRegit does not currently respond to DNT signals because our minimal storage usage does not involve cross-site tracking.

## 8. Changes to This Cookie Policy

We may update this Cookie Policy from time to time. We will post the updated policy on this page and update the "Last updated" date. We encourage you to review this policy periodically.

## 9. Contact Us

If you have any questions about our use of cookies, please contact us:

**Email**: support@clientregit.com`,
  },

  'refund-policy': {
    title: 'Refund Policy',
    content: `# Refund Policy

**Last updated: January 1, 2026**

## 1. Overview

At ClientRegit, we are committed to providing a high-quality service for creative professionals. We understand that circumstances may arise where a refund is appropriate. This policy outlines when and how refunds are available for subscriptions, one-time purchases, and other payments made through the Service.

## 2. Subscription Cancellation and Refunds

### 2.1 Canceling Your Subscription

You may cancel your subscription at any time through the Billing section of your account settings. When you cancel:

- Your subscription remains active until the end of your current billing period (monthly or yearly)
- You retain full access to paid features for the remainder of the period
- At the end of the period, your account automatically downgrades to the free plan
- No further charges are made to your payment method

### 2.2 Refund for Remaining Billing Period

Due to the nature of digital services, we generally do not offer refunds for the unused portion of a billing period after cancellation. Your service continues to be available until the end of the period you have already paid for.

### 2.3 Exception: Service Failure

If the Service is materially unavailable for a significant portion of your billing period due to issues on our end, you may request a pro-rated refund for that period. Contact us at support@clientregit.com with a description of the issue.

## 3. One-Time Purchase Refunds (Lifetime Plans)

### 3.1 Seven-Day Refund Window

If you purchase a lifetime plan or any one-time upgrade, you may request a full refund within 7 days of the purchase date, provided:

- You have not substantially used the Service (defined as creating more than 10 clients or 5 projects)
- The refund request is made directly by the account holder
- The purchase was made through the official ClientRegit checkout

### 3.2 After 7 Days

Refunds for one-time purchases are not available after the 7-day window has passed, unless required by applicable consumer protection law.

## 4. Duplicate Payments

If you were accidentally charged twice for the same billing period or plan upgrade:

- Contact us immediately at support@clientregit.com
- Provide your name, email, and both transaction IDs or payment references
- We will verify the duplicate charge and issue a refund for the extra payment within 5-7 business days

We take duplicate payments seriously and will resolve them as quickly as possible.

## 5. Failed Payments

### 5.1 Automatic Retries

When a recurring payment fails (due to insufficient funds, card expiry, or other issues), we automatically retry the payment up to three times over a 7-day period. You will receive email notifications about each retry attempt.

### 5.2 No Charge on Failure

If all retry attempts fail, no payment is collected for that period. Your subscription is downgraded to the free plan at the end of the current billing period.

### 5.3 Accidental Charges on Failed Payments

If you believe you were charged despite a failed payment, or were charged multiple times due to a payment processing error, contact us at support@clientregit.com with the relevant transaction details. We will investigate and issue a refund if the charge was erroneous.

## 6. Billing Errors

If a billing error results in an incorrect charge amount:

- Contact us at support@clientregit.com within 30 days of the charge
- Provide the details of the incorrect charge
- We will verify the error and issue a refund or credit for the difference within 5-7 business days

## 7. How to Request a Refund

To request a refund:

1. **Email us** at support@clientregit.com
2. **Include** the following information:
   - Your full name and email address associated with your ClientRegit account
   - The date of the payment you are requesting a refund for
   - The transaction ID or payment reference (found in your Billing > Payment History)
   - A clear description of why you are requesting a refund

### 7.1 Response Time

We aim to acknowledge your refund request within 1 business day and provide a resolution within 5-7 business days. During peak periods, it may take up to 10 business days.

### 7.2 Refund Method

Refunds are issued to the original payment method used for the purchase. Depending on your bank or payment provider, it may take an additional 5-10 business days for the refund to appear in your account.

## 8. What Is Not Eligible for Refund

The following are not eligible for refunds:

- Subscription fees for periods where the Service was accessible and used
- One-time purchases made more than 7 days ago (unless required by law)
- Coupon-based discounts that were correctly applied
- Fees for payment processing that were correctly processed by Razorpay
- Accounts that were terminated due to violation of our Terms & Conditions

## 9. Chargebacks

If you initiate a chargeback or payment dispute with your bank or credit card provider without first contacting us, we reserve the right to:

- Temporarily suspend your account while the dispute is being investigated
- Provide documentation to the payment provider showing the transaction was legitimate
- Permanent account termination if the chargeback is found to be fraudulent

We strongly encourage you to contact us first at support@clientregit.com so we can resolve any billing concerns directly.

## 10. Free Plan

The free plan does not require payment and therefore is not subject to refunds. Data created on the free plan is retained as long as your account is active.

## 11. Changes to This Policy

We may update this Refund Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. Refund requests will be evaluated under the policy in effect at the time of the original payment.

## 12. Contact Us

If you have any questions about this Refund Policy or need to request a refund:

**Email**: support@clientregit.com

We are committed to resolving billing concerns fairly and promptly.`,
  },

  'acceptable-use': {
    title: 'Acceptable Use Policy',
    content: `# Acceptable Use Policy

**Last updated: January 1, 2026**

## 1. Introduction

This Acceptable Use Policy ("AUP") describes the rules and guidelines for using ClientRegit (the "Service"). By using the Service, you agree to comply with this policy. We reserve the right to suspend or terminate accounts that violate these guidelines.

## 2. Prohibited Content

You may not use the Service to create, store, upload, or share content that:

- **Is illegal**: Content that violates any applicable local, national, or international law or regulation
- **Is harmful or dangerous**: Content that promotes violence, self-harm, terrorism, or organized crime
- **Is sexually explicit**: Pornographic, obscene, or sexually exploitative content, especially involving minors
- **Is hateful**: Content that promotes discrimination, hatred, or violence against individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics
- **Is defamatory or harassing**: Content that constitutes defamation, harassment, cyberbullying, or stalking of any individual
- **Infringes privacy**: Content that violates the privacy of others, including unauthorized sharing of personal information (doxxing)
- **Is misleading or fraudulent**: Content designed to deceive, defraud, or impersonate others

## 3. Copyright and Intellectual Property

### 3.1 Respect for Copyrights

You must not use the Service to store, distribute, or share content that infringes upon the copyrights, trademarks, patents, or other intellectual property rights of third parties. This includes:

- Uploading copyrighted video, image, or audio content without proper authorization
- Sharing proprietary materials without permission
- Using trademarks or brand names in a misleading way

### 3.2 DMCA and Takedown Requests

If you believe that content stored in the Service infringes your copyright, you may submit a takedown request to support@clientregit.com with:

- A description of the copyrighted work you claim has been infringed
- The location (URL or description) of the allegedly infringing content
- Your contact information and proof of ownership
- A statement that you have a good faith belief that the use is not authorized
- A statement under penalty of perjury that the information is accurate

We will review all takedown requests promptly and take appropriate action.

### 3.3 Your Responsibility

As a user, you are solely responsible for ensuring that you have the right to store and share any content you upload to the Service. ClientRegit is not liable for any copyright infringement resulting from user-uploaded content.

## 4. Malware and Security

You may not use the Service to:

- Upload, distribute, or transmit viruses, worms, trojans, ransomware, or any other malicious software
- Attempt to gain unauthorized access to the Service, other user accounts, or any connected systems
- Introduce code designed to disrupt, damage, or gain unauthorized access to the Service or its data
- Conduct security scans, penetration testing, or vulnerability assessments without our written permission
- Interfere with or disrupt the Service, servers, or networks connected to the Service
- Bypass or attempt to bypass any security measures, rate limits, or access controls

## 5. Fraud and Misrepresentation

You may not use the Service to:

- Engage in fraudulent financial transactions or invoicing
- Create fake client profiles or project records for deceptive purposes
- Misrepresent your identity, affiliation, or qualifications
- Impersonate another person, company, or entity
- Use the Service to facilitate scams or deceptive practices

## 6. Abuse and Harassment

You may not use the Service to:

- Harass, threaten, bully, or intimidate other users or individuals
- Engage in cyberbullying or targeted harassment campaigns
- Share content that is abusive, degrading, or harmful to others
- Target individuals based on protected characteristics (race, gender, religion, etc.)
- Use the Service as a platform for coordinating harmful activities

## 7. Spam and Unsolicited Communications

You may not use the Service to:

- Send unsolicited bulk messages, emails, or communications (spam)
- Use client contact information obtained through the Service for unsolicited marketing
- Distribute chain letters, pyramid schemes, or other unsolicited commercial communications
- Use automated tools to interact with the Service in ways that constitute spam

### 7.1 Legitimate Client Communication

Using the Service to communicate with your own clients about legitimate projects, invoices, and deliverables is an intended use of the Service and is not considered spam.

## 8. Unauthorized Access

You may not use the Service to:

- Access or attempt to access other users' accounts without authorization
- Use another user's credentials to access the Service
- Access the Service using automated tools, bots, or scripts without written permission
- Scrape, crawl, or index the Service for data collection purposes without permission
- Attempt to bypass authentication or authorization mechanisms

## 9. Payment and Billing Abuse

You may not use the Service to:

- Manipulate or falsify invoice amounts, payment records, or billing information
- Use stolen, fraudulent, or unauthorized payment methods
- Exploit bugs or errors in the billing system for financial gain
- Create multiple accounts to circumvent plan limits, trial periods, or coupon restrictions
- Share or resell subscription access without our written permission

## 10. Data Privacy Violations

You may not use the Service to:

- Store personal data about individuals without their consent or a lawful basis
- Violate applicable data protection laws (including but not limited to GDPR, CCPA, or other regional regulations)
- Collect personal information through the Service for purposes not disclosed to the data subjects
- Transfer personal data to jurisdictions without adequate data protection safeguards

## 11. Monitoring and Enforcement

### 11.1 Our Right to Monitor

We reserve the right to monitor usage of the Service to detect violations of this policy. We will not access your content except:

- When required by law or valid legal process
- When necessary to investigate a reported violation of this policy
- When necessary to protect the rights, property, or safety of ClientRegit, our users, or the public
- When you request support and provide consent for us to access specific content

### 11.2 Consequences of Violations

Violations of this policy may result in:

- **Warning**: A notice requesting you to stop the violating activity
- **Suspension**: Temporary suspension of your account pending investigation
- **Termination**: Permanent termination of your account
- **Legal action**: Referral to law enforcement authorities where appropriate

The severity of the response depends on the nature and severity of the violation. Repeated or severe violations will result in immediate account termination.

## 12. Reporting Violations

If you become aware of any violation of this Acceptable Use Policy, please report it to us immediately at support@clientregit.com with:

- A description of the violation
- Any relevant URLs, screenshots, or evidence
- Your contact information

We will investigate all reports and take appropriate action.

## 13. Changes to This Policy

We may update this Acceptable Use Policy from time to time. We will post the updated policy on this page and update the "Last updated" date. Continued use of the Service after changes are posted constitutes acceptance of the revised policy.

## 14. Contact Us

If you have any questions about this Acceptable Use Policy:

**Email**: support@clientregit.com`,
  },

  security: {
    title: 'Security',
    content: `# Security

**Last updated: January 1, 2026**

At ClientRegit, security is a core priority. We implement multiple layers of protection to keep your data safe. This page describes our security practices and how you can help protect your account.

## 1. Authentication

### 1.1 Password Security

- Passwords are hashed using **bcrypt** with a salt factor of 10 before storage
- We never store plaintext passwords — not even administrators can view your password
- Password requirements enforce minimum 8 characters with uppercase, lowercase, number, and symbol
- Maximum password length is 64 characters to prevent abuse

### 1.2 Session Management

- Authentication uses JSON Web Tokens (JWT) with a 30-day expiration
- Tokens are signed with a secure secret (minimum 16 characters)
- Tokens are stored in your browser's localStorage and sent with each API request via the Authorization header
- Expired or invalid tokens result in automatic logout and redirect to the login page
- Tokens are invalidated when you log out or delete your account

### 1.3 Rate Limiting

- Login attempts are rate-limited to 20 attempts per 15 minutes per IP address
- Registration is rate-limited to 20 attempts per 15 minutes per IP address
- Billing operations (order creation, payment verification, coupon validation) are rate-limited to 30 requests per minute
- Rate limits help prevent brute-force attacks and abuse

## 2. Authorization

### 2.1 Role-Based Access Control

The Service implements role-based access control with two roles:

- **Editor**: Can manage clients, projects, tasks, videos, and invoices within their own account
- **Admin**: Has additional privileges including billing management, user administration, and system settings

### 2.2 Data Isolation

Each user's data is isolated at the application level:

- All database queries are scoped to the authenticated user's ID
- Users can only access their own clients, projects, tasks, videos, invoices, and settings
- Shared video links use unique, randomly generated tokens that cannot be guessed
- API endpoints enforce authentication and authorization checks on every request

### 2.3 Middleware Protection

All sensitive API routes are protected by authentication middleware that:

- Validates the JWT token on every request
- Loads the authenticated user's profile from the database
- Attaches the user object to the request for downstream handlers
- Returns a 401 Unauthorized response if the token is missing, expired, or invalid

Admin-only routes are additionally protected by role-checking middleware.

## 3. Payment Security

### 3.1 Razorpay Integration

All payment processing is handled by **Razorpay**, a PCI DSS Level 1 compliant payment processor. Key security aspects:

- Credit/debit card details are entered directly into Razorpay's secure payment form
- Card data never touches our servers — it goes directly from your browser to Razorpay
- We receive only a confirmation token and transaction ID after a successful payment
- Razorpay uses 256-bit SSL encryption for all payment data in transit

### 3.2 No Card Storage

ClientRegit does not store:

- Credit or debit card numbers
- CVV or CVC codes
- Full cardholder names (beyond what is needed for display)
- Card expiry dates

### 3.3 Payment Verification

- Payment signatures are cryptographically verified using HMAC-SHA256
- Webhook events from Razorpay are validated to prevent spoofing
- Duplicate webhook events are detected and rejected using event ID tracking
- Payment amounts and order details are verified against our records

## 4. Data Protection

### 4.1 Encryption in Transit

All communication between your browser and the ClientRegit servers is encrypted using HTTPS/TLS. This includes:

- Login and registration forms
- All API requests and responses
- File uploads and downloads
- Shared video page access

### 4.2 Database Security

- The SQLite database is stored on the server filesystem with restricted access
- Database files are not publicly accessible
- Backups are created atomically using a write-to-temp-then-rename strategy
- Previous backup copies are maintained for recovery purposes

### 4.3 Input Validation

- All user inputs are validated and sanitized before being processed
- SQL queries use parameterized statements to prevent SQL injection
- Request body size is limited to 10MB to prevent denial-of-service attacks
- File uploads are validated for type and size

### 4.4 Security Headers

The server applies security headers using the Helmet middleware:

- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security (HSTS)
- Referrer-Policy
- Permissions-Policy

## 5. File Access and Uploads

### 5.1 Video Files

- Video uploads are limited to 300MB per file
- Only video files with allowed MIME types are accepted
- Uploaded video files are stored in a protected directory on the server
- Video file access requires authentication (except via shared links)
- Shared video links use unique, unguessable tokens

### 5.2 File Storage

- All files are stored on server-side filesystem storage
- No files are stored in publicly accessible directories
- File paths are not exposed to end users
- Uploaded files inherit the same access controls as the user who uploaded them

## 6. Infrastructure Security

### 6.1 Server Hardening

- The server runs with minimal privileges
- Unnecessary services and ports are disabled
- Operating system and dependencies are kept up to date
- Security logs are monitored for suspicious activity

### 6.2 Dependency Management

- Server-side dependencies are regularly updated
- Known vulnerabilities in dependencies are addressed promptly
- The application uses well-maintained, widely-used libraries (Express, bcryptjs, jsonwebtoken, helmet)

## 7. Data Backup and Recovery

- Database backups are created automatically during each save operation
- A previous backup copy is maintained for recovery
- Backup files use a timestamped naming scheme to prevent overwrites
- The backup process uses atomic file operations to prevent corruption

## 8. Incident Response

In the event of a security incident:

1. We will investigate the incident promptly
2. We will take steps to contain and remediate the issue
3. We will notify affected users as soon as reasonably possible
4. We will cooperate with relevant authorities as required by law
5. We will conduct a post-incident review to prevent future occurrences

## 9. Reporting Security Issues

If you discover a security vulnerability in ClientRegit, please report it responsibly:

**Email**: support@clientregit.com

Please include:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes (optional)

We take all security reports seriously and will respond within 48 hours. We ask that you do not publicly disclose the vulnerability until we have had a chance to address it.

## 10. How You Can Protect Your Account

You play an important role in keeping your account secure:

- **Choose a strong password**: Use a unique, complex password that you don't use elsewhere
- **Enable email security**: Ensure your email account has two-factor authentication enabled
- **Keep your browser updated**: Use the latest version of your browser for the best security
- **Log out on shared devices**: Always log out if you access the Service from a public or shared computer
- **Don't share credentials**: Never share your login credentials with others
- **Monitor your account**: Report any suspicious activity immediately

## 11. Changes to This Page

We may update this Security page from time to time to reflect changes in our practices or new security measures. We encourage you to review this page periodically.

## 12. Contact Us

If you have any questions about our security practices:

**Email**: support@clientregit.com`,
  },

  'advertising-policy': {
    title: 'Advertising Policy',
    content: `# Advertising Policy

**Last updated: January 1, 2026**

## 1. Overview

This Advertising Policy explains how ClientRegit (the "Service") handles advertising, ad placement, and the use of cookies in connection with any advertising features. We are committed to transparency about our advertising practices.

## 2. Ad Placement

### 2.1 Free Plan

The Service may display advertisements on certain pages for users on the free plan. Advertisements are used to help support the free tier of the Service and keep it accessible to all users.

### 2.2 Paid Plans

Users on paid plans (Pro, Business, or Lifetime) do **not** see any advertisements. Upgrading to a paid plan removes all advertising from your experience.

### 2.3 Ad Formats

When advertisements are displayed, they may include:

- **Display ads**: Standard banner or sidebar advertisements
- **In-content ads**: Advertisements placed between content sections on specific pages

We do not display:

- Pop-up ads or pop-under ads
- Auto-playing audio or video ads
- Ads that overlay or obscure content you are actively viewing
- Deceptive ads designed to look like system messages or notifications

### 2.4 Ad Content Standards

We aim to partner with advertising networks and advertisers that maintain high content standards. Advertisements displayed on the Service should not:

- Contain malware, viruses, or deceptive code
- Be misleading or fraudulent
- Promote illegal products or services
- Contain adult, violent, or otherwise inappropriate content
- Attempt to phish user credentials or personal information

If you encounter an advertisement that violates these standards, please report it to support@clientregit.com.

## 3. Cookies and Advertising

### 3.1 Advertising Cookies

If advertising is enabled on the Service, our advertising partners may use cookies and similar technologies to:

- **Serve relevant ads**: Display advertisements that are more relevant to your interests based on your browsing activity
- **Limit ad frequency**: Prevent the same advertisement from being shown too many times
- **Measure ad performance**: Track how many times an ad was displayed and whether it was clicked
- **Prevent fraud**: Detect and prevent fraudulent ad clicks or impressions

### 3.2 Types of Advertising Cookies

Advertising cookies that may be set include:

| Cookie Purpose | Provider | Duration | Description |
|---|---|---|---|
| Ad targeting | Advertising network | 30-90 days | Tracks browsing patterns to serve relevant ads |
| Ad frequency | Advertising network | Session-7 days | Limits how often an ad is shown |
| Ad measurement | Advertising network | 30-90 days | Measures ad impressions and clicks |
| Fraud detection | Advertising network | Session-30 days | Prevents fraudulent ad activity |

### 3.3 Disabling Advertising Cookies

You can opt out of advertising cookies by:

- Adjusting your browser settings to block third-party cookies
- Using browser extensions that block advertising trackers
- Visiting the opt-out pages of specific advertising networks

Note: Blocking advertising cookies will not remove ads from the Service but may result in less relevant advertisements being displayed.

## 4. No Encouragement to Click Ads

### 4.1 Our Commitment

ClientRegit does **not**:

- Encourage or incentivize users to click on advertisements
- Use misleading labels or design patterns to make ads look like organic content
- Place ads where they are likely to be accidentally clicked
- Use "dark patterns" to trick users into interacting with ads
- Offer rewards, credits, or benefits for clicking on ads

### 4.2 Ad Labeling

All advertisements displayed on the Service are clearly labeled as "Ad," "Advertisement," or "Sponsored" to ensure users can distinguish between ads and organic content.

## 5. Third-Party Advertising

### 5.1 Advertising Networks

We may partner with third-party advertising networks to serve advertisements on the Service. These networks may:

- Use cookies and tracking technologies as described in this policy
- Collect non-personal information about your browsing activity across websites
- Use this information to serve relevant advertisements

### 5.2 Google AdSense

If we use Google AdSense, Google's use of advertising cookies enables it and its partners to serve ads based on your visit to the Service and/or other sites on the Internet. You can opt out of personalized advertising by visiting Google's ad settings: https://www.google.com/settings/ads

### 5.3 Other Ad Networks

If we use other advertising networks, we will disclose the specific networks and their privacy practices on this page or through a supplementary notice.

### 5.4 Data Shared with Advertisers

We do not share your personal information (name, email, phone number, client data, project data, or any content you create) with advertisers. Advertising networks receive only:

- Non-personal, anonymized browsing data
- Ad impression and click data
- Device and browser information (for ad targeting purposes)

## 6. Ad-Free Experience

### 6.1 Upgrading to Remove Ads

The simplest way to remove all advertisements from the Service is to upgrade to a paid plan. Paid plans include an ad-free experience as a standard benefit.

### 6.2 Ad Removal Is Immediate

Once you upgrade, advertisements are removed from your account immediately. No further action is required on your part.

## 7. Children's Advertising

The Service is not intended for users under the age of 18. We do not serve personalized advertisements to users we know are minors. If we become aware that a user is under 18, we will disable personalized advertising for that account.

## 8. Changes to This Policy

We may update this Advertising Policy from time to time. We will post the updated policy on this page and update the "Last updated" date. Material changes to our advertising practices will be communicated through the Service or via email.

## 9. Contact Us

If you have any questions about this Advertising Policy or wish to report an inappropriate advertisement:

**Email**: support@clientregit.com`,
  },
};

exports.getPage = (req, res) => {
  try {
    const { slug } = req.params;

    // Try to load from legal_pages table (created by admin)
    try {
      const dbPage = queryOne('SELECT title, content, version, updated_at FROM legal_pages WHERE page_slug = ?', [slug]);
      if (dbPage) {
        return res.json({
          success: true,
          data: {
            title: dbPage.title,
            content: dbPage.content,
            version: dbPage.version,
            updated_at: dbPage.updated_at,
          },
        });
      }
    } catch (e) {
      // Table may not exist yet, fall through to defaults
    }

    // Fall back to default pages
    const defaultPage = DEFAULT_PAGES[slug];
    if (defaultPage) {
      return res.json({
        success: true,
        data: {
          title: defaultPage.title,
          content: defaultPage.content,
          version: 1,
          updated_at: null,
        },
      });
    }

    return res.status(404).json({ success: false, message: 'Page not found' });
  } catch (error) {
    console.error('PUBLIC_PAGE_ERROR', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getSeoMeta = (req, res) => {
  try {
    // Try to load from seo_settings table (managed by admin controller)
    try {
      const settings = {};
      const rows = queryAll('SELECT key, value FROM seo_settings');
      if (rows && rows.length > 0) {
        rows.forEach((r) => { settings[r.key] = r.value; });
        return res.json({ success: true, data: settings });
      }
    } catch (e) {
      // Table may not exist yet, fall through to defaults
    }

    // Return defaults
    return res.json({
      success: true,
      data: {
        site_title: 'ClientRegit — Client Management for Creative Professionals',
        site_description: 'Manage clients, projects, video reviews, tasks, and invoices in one calm workspace built for video editors and freelancers.',
        og_image: '',
        canonical_base_url: 'https://clientregit.com',
        google_verification_code: '',
        google_analytics_id: '',
        search_console_verification: '',
        organization_name: 'ClientRegit',
        contact_email: 'support@clientregit.com',
      },
    });
  } catch (error) {
    console.error('SEO_META_ERROR', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.DEFAULT_PAGES = DEFAULT_PAGES;
