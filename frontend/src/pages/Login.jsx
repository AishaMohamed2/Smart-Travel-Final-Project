/* Title: react-living-app
Author: djirdehh
Date: August 2017
Code version: n/a
Availability: https://github.com/djirdehh/react-living-app
REUSED ALL*/

import Form from "../components/Form"

function Login() {
    return <Form route="/api/token/" method="login" />
}

export default Login