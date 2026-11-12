<?php

namespace App\Http\Responses;

use App\Http\Controllers\Auth\DesktopAuthenticationController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;

class LogoutResponse implements LogoutResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 204);
        }

        $isDesktop = DesktopAuthenticationController::isDesktopClient($request);

        Log::info('Fortify LogoutResponse resolved', [
            'is_desktop' => $isDesktop,
            'has_desktop_ua' => str_contains((string) $request->header('User-Agent', ''), 'InstitutoPropio-Desktop'),
            'has_desktop_cookie' => $request->cookie('is_desktop_client') === '1',
        ]);

        if ($isDesktop) {
            return redirect()->route('desktop.welcome');
        }

        return redirect('/');
    }
}

